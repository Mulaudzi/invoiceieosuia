<?php

class GdprController {
    /**
     * Export all user data (GDPR Article 20 - Right to data portability)
     */
    public function export(): void {
        $userId = Auth::id();
        
        // Get all user data
        $user = User::query()->find($userId);
        unset($user['password']);
        
        $clients = Client::query()->where('user_id', $userId)->get();
        $products = Product::query()->where('user_id', $userId)->get();
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        $payments = Payment::query()->where('user_id', $userId)->get();
        $templates = Template::query()->where('user_id', $userId)->get();
        
        // Get invoice items for each invoice
        foreach ($invoices as &$invoice) {
            $invoice['items'] = InvoiceItem::query()
                ->where('invoice_id', $invoice['id'])
                ->get();
        }
        
        $exportData = [
            'user' => Auth::formatUserForFrontend($user),
            'clients' => $clients,
            'products' => $products,
            'invoices' => $invoices,
            'payments' => $payments,
            'templates' => $templates,
            'exported_at' => date('c'),
        ];
        
        // Log the export for audit purposes
        error_log("GDPR data export for user ID: $userId");
        
        Response::json($exportData);
    }
    
    /**
     * Delete all user data (GDPR Article 17 - Right to erasure)
     */
    public function delete(): void {
        $userId = Auth::id();
        $db = Database::getConnection();
        
        try {
            $db->beginTransaction();
            
            // Get user email for logging
            $user = User::query()->find($userId);
            $email = $user['email'] ?? 'unknown';
            
            // Delete invoice items first (foreign key constraint)
            $invoiceIds = Invoice::query()
                ->where('user_id', $userId)
                ->get();
            $invoiceIdList = array_column($invoiceIds, 'id');
            
            if (!empty($invoiceIdList)) {
                $placeholders = str_repeat('?,', count($invoiceIdList) - 1) . '?';
                $stmt = $db->prepare("DELETE FROM invoice_items WHERE invoice_id IN ($placeholders)");
                $stmt->execute($invoiceIdList);
            }
            
            // Delete payments
            $stmt = $db->prepare("DELETE FROM payments WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete invoices
            $stmt = $db->prepare("DELETE FROM invoices WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete clients
            $stmt = $db->prepare("DELETE FROM clients WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete products
            $stmt = $db->prepare("DELETE FROM products WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete templates
            $stmt = $db->prepare("DELETE FROM templates WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete API tokens
            $stmt = $db->prepare("DELETE FROM api_tokens WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete email verifications
            $stmt = $db->prepare("DELETE FROM email_verifications WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Delete avatar if exists
            $uploadDir = __DIR__ . '/../uploads/avatars/';
            if (!empty($user['avatar'])) {
                $avatarPath = $uploadDir . basename($user['avatar']);
                if (file_exists($avatarPath)) {
                    unlink($avatarPath);
                }
            }
            
            // Delete logo if exists
            if (!empty($user['logo'])) {
                $logoDir = __DIR__ . '/../uploads/logos/';
                $logoPath = $logoDir . basename($user['logo']);
                if (file_exists($logoPath)) {
                    unlink($logoPath);
                }
            }
            
            // Finally delete the user
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            $db->commit();
            
            // Log the deletion for audit purposes
            error_log("GDPR account deletion completed for: $email (User ID: $userId)");
            
            Response::success(['message' => 'Account and all data deleted successfully']);
            
        } catch (Exception $e) {
            $db->rollBack();
            error_log("GDPR deletion failed for user ID $userId: " . $e->getMessage());
            Response::error('Failed to delete account. Please contact support.', 500);
        }
    }
}
