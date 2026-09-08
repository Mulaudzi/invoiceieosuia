<?php

/**
 * Settings Controller
 * Manages application-wide settings stored in the database
 * Provides centralized configuration management
 */
class SettingsController {
    
    /**
     * Get all settings or specific setting by key
     */
    public function getSettings(): void {
        $request = new Request();
        $key = $request->query('key');
        
        $db = Database::getConnection();
        
        if ($key) {
            // Get specific setting
            $stmt = $db->prepare("SELECT id, setting_key AS `key`, setting_value AS `value`, setting_group AS category, description, created_at, updated_at FROM settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            $setting = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$setting) {
                Response::error('Setting not found', 404);
                return;
            }
            
            // Parse JSON value if it's a stringified array/object
            if (isset($setting['value'])) {
                $decoded = json_decode($setting['value'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $setting['value'] = $decoded;
                }
            }
            
            Response::json($setting);
        } else {
            // Get all settings grouped by category
            $stmt = $db->query("SELECT id, setting_key AS `key`, setting_value AS `value`, setting_group AS category, description, created_at, updated_at FROM settings ORDER BY setting_group, setting_key ASC");
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Group by category
            $grouped = [];
            foreach ($settings as $setting) {
                $category = $setting['category'] ?? 'general';
                if (!isset($grouped[$category])) {
                    $grouped[$category] = [];
                }
                
                // Parse JSON values
                if (isset($setting['value'])) {
                    $decoded = json_decode($setting['value'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $setting['value'] = $decoded;
                    }
                }
                
                $grouped[$category][] = $setting;
            }
            
            Response::json(['data' => $grouped]);
        }
    }
    
    /**
     * Update a setting
     */
    public function updateSetting(array $params): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $key = (string) ($params['key'] ?? '');
        
        if (!$key) {
            Response::error('Setting key required', 400);
            return;
        }
        
        $data = $request->all();
        $value = $data['value'] ?? null;
        $category = $data['category'] ?? 'general';
        $description = $data['description'] ?? '';
        
        if ($value === null) {
            Response::error('Value is required', 422);
            return;
        }
        
        // Convert arrays/objects to JSON
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }
        
        $db = Database::getConnection();
        
        // Check if setting exists
        $stmt = $db->prepare("SELECT id FROM settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $existing = $stmt->fetch();
        
        try {
            if ($existing) {
                // Update existing
                $stmt = $db->prepare("
                    UPDATE settings 
                    SET setting_value = ?, setting_group = ?, description = ?, updated_at = NOW()
                    WHERE setting_key = ?
                ");
                $stmt->execute([$value, $category, $description, $key]);
            } else {
                // Create new
                $stmt = $db->prepare("
                    INSERT INTO settings (setting_key, setting_value, setting_group, description, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$key, $value, $category, $description]);
            }
            
            // Log the update
            AdminActivityLogger::logSettings('setting_updated', [
                'setting_key' => $key,
                'category' => $category
            ]);
            
            // Return updated setting
            $stmt = $db->prepare("SELECT id, setting_key AS `key`, setting_value AS `value`, setting_group AS category, description, created_at, updated_at FROM settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            $updated = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON value
            if (isset($updated['value'])) {
                $decoded = json_decode($updated['value'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $updated['value'] = $decoded;
                }
            }
            
            Response::json([
                'success' => true,
                'message' => 'Setting updated successfully',
                'data' => $updated
            ]);
        } catch (Exception $e) {
            error_log("Error updating setting: " . $e->getMessage());
            Response::error('Failed to update setting', 500);
        }
    }
    
    /**
     * Batch update multiple settings
     */
    public function batchUpdateSettings(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $updates = $request->input('updates');
        
        if (!is_array($updates) || empty($updates)) {
            Response::error('Updates array is required', 422);
            return;
        }
        
        $db = Database::getConnection();
        $results = [];
        $errors = [];
        
        try {
            foreach ($updates as $update) {
                $key = $update['key'] ?? null;
                $value = $update['value'] ?? null;
                $category = $update['category'] ?? 'general';
                $description = $update['description'] ?? '';
                
                if (!$key || $value === null) {
                    $errors[] = ['key' => $key, 'error' => 'Key and value required'];
                    continue;
                }
                
                // Convert arrays/objects to JSON
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value);
                }
                
                // Check if setting exists
                $stmt = $db->prepare("SELECT id FROM settings WHERE setting_key = ?");
                $stmt->execute([$key]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    // Update existing
                    $stmt = $db->prepare("
                        UPDATE settings 
                        SET setting_value = ?, setting_group = ?, description = ?, updated_at = NOW()
                        WHERE setting_key = ?
                    ");
                    $stmt->execute([$value, $category, $description, $key]);
                } else {
                    // Create new
                    $stmt = $db->prepare("
                        INSERT INTO settings (setting_key, setting_value, setting_group, description, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    ");
                    $stmt->execute([$key, $value, $category, $description]);
                }
                
                $results[] = $key;
            }
            
            // Log batch update
            AdminActivityLogger::logSettings('settings_batch_updated', [
                'updated_count' => count($results),
                'error_count' => count($errors)
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Settings updated',
                'updated_count' => count($results),
                'updated_keys' => $results,
                'errors' => $errors
            ]);
        } catch (Exception $e) {
            error_log("Error in batch update settings: " . $e->getMessage());
            Response::error('Failed to update settings', 500);
        }
    }
    
    /**
     * Delete a setting
     */
    public function deleteSetting(array $params): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $key = (string) ($params['key'] ?? '');
        
        if (!$key) {
            Response::error('Setting key required', 400);
            return;
        }
        
        $db = Database::getConnection();
        
        // Check if setting exists
        $stmt = $db->prepare("SELECT id, setting_key AS `key`, setting_value AS `value`, setting_group AS category, description, created_at, updated_at FROM settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $setting = $stmt->fetch();
        
        if (!$setting) {
            Response::error('Setting not found', 404);
            return;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            
            // Log deletion
            AdminActivityLogger::logSettings('setting_deleted', [
                'setting_key' => $key,
                'category' => $setting['category'] ?? 'general'
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Setting deleted successfully'
            ]);
        } catch (Exception $e) {
            error_log("Error deleting setting: " . $e->getMessage());
            Response::error('Failed to delete setting', 500);
        }
    }
    
    /**
     * Get mail settings
     */
    public function getMailSettings(): void {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT setting_key AS `key`, setting_value AS `value` FROM settings
            WHERE setting_group = 'mail'
            ORDER BY setting_key ASC
        ");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $mailSettings = [];
        foreach ($settings as $setting) {
            $decoded = json_decode($setting['value'], true);
            $mailSettings[$setting['key']] = $decoded !== null ? $decoded : $setting['value'];
        }
        
        Response::json($mailSettings);
    }
    
    /**
     * Update mail settings
     */
    public function updateMailSettings(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $mailSettings = $request->all();
        
        $db = Database::getConnection();
        
        try {
            foreach ($mailSettings as $key => $value) {
                // Convert to JSON if array/object
                $jsonValue = is_array($value) || is_object($value) ? json_encode($value) : $value;
                
                // Check if exists
                $stmt = $db->prepare("SELECT id FROM settings WHERE setting_key = ?");
                $stmt->execute([$key]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    $stmt = $db->prepare("
                        UPDATE settings 
                        SET setting_value = ?, updated_at = NOW()
                        WHERE setting_key = ?
                    ");
                    $stmt->execute([$jsonValue, $key]);
                } else {
                    $stmt = $db->prepare("
                        INSERT INTO settings (setting_key, setting_value, setting_group, created_at)
                        VALUES (?, ?, 'mail', NOW())
                    ");
                    $stmt->execute([$key, $jsonValue]);
                }
            }
            
            // Log update
            AdminActivityLogger::logSettings('mail_settings_updated', [
                'settings_count' => count($mailSettings)
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Mail settings updated successfully'
            ]);
        } catch (Exception $e) {
            error_log("Error updating mail settings: " . $e->getMessage());
            Response::error('Failed to update mail settings', 500);
        }
    }
    
    /**
     * Get payment gateway settings
     */
    public function getPaymentSettings(): void {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT setting_key AS `key`, setting_value AS `value` FROM settings
            WHERE setting_group = 'payment'
            ORDER BY setting_key ASC
        ");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $paymentSettings = [];
        foreach ($settings as $setting) {
            $decoded = json_decode($setting['value'], true);
            $paymentSettings[$setting['key']] = $decoded !== null ? $decoded : $setting['value'];
        }
        
        Response::json($paymentSettings);
    }
    
    /**
     * Update payment gateway settings
     */
    public function updatePaymentSettings(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $paymentSettings = $request->all();
        
        $db = Database::getConnection();
        
        try {
            foreach ($paymentSettings as $key => $value) {
                // Convert to JSON if array/object
                $jsonValue = is_array($value) || is_object($value) ? json_encode($value) : $value;
                
                // Check if exists
                $stmt = $db->prepare("SELECT id FROM settings WHERE setting_key = ?");
                $stmt->execute([$key]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    $stmt = $db->prepare("
                        UPDATE settings 
                        SET setting_value = ?, updated_at = NOW()
                        WHERE setting_key = ?
                    ");
                    $stmt->execute([$jsonValue, $key]);
                } else {
                    $stmt = $db->prepare("
                        INSERT INTO settings (setting_key, setting_value, setting_group, created_at)
                        VALUES (?, ?, 'payment', NOW())
                    ");
                    $stmt->execute([$key, $jsonValue]);
                }
            }
            
            // Log update
            AdminActivityLogger::logSettings('payment_settings_updated', [
                'settings_count' => count($paymentSettings)
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Payment settings updated successfully'
            ]);
        } catch (Exception $e) {
            error_log("Error updating payment settings: " . $e->getMessage());
            Response::error('Failed to update payment settings', 500);
        }
    }
    
    /**
     * Reset settings to defaults
     */
    public function resetToDefaults(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $category = $request->input('category'); // Optional: reset specific category only
        
        $db = Database::getConnection();
        
        try {
            if ($category) {
                $stmt = $db->prepare("DELETE FROM settings WHERE setting_group = ?");
                $stmt->execute([$category]);
                $message = "Settings for category '$category' reset to defaults";
            } else {
                $stmt = $db->prepare("DELETE FROM settings");
                $stmt->execute();
                $message = "All settings reset to defaults";
            }
            
            // Log reset
            AdminActivityLogger::logSettings('settings_reset', [
                'category' => $category ?? 'all'
            ]);
            
            Response::json([
                'success' => true,
                'message' => $message
            ]);
        } catch (Exception $e) {
            error_log("Error resetting settings: " . $e->getMessage());
            Response::error('Failed to reset settings', 500);
        }
    }
}
