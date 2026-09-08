<?php

/**
 * Blocked Email Domains Controller
 * Manages blocked/disposable email domains in the database
 */
class BlockedDomainsController {
    
    /**
     * Get all blocked domains
     */
    public function getAll(): void {
        $request = new Request();
        $page = (int)($request->query('page') ?? 1);
        $perPage = (int)($request->query('per_page') ?? 50);
        $search = $request->query('search');
        $offset = ($page - 1) * $perPage;
        
        $db = Database::getConnection();
        
        $where = [];
        $params = [];
        
        if ($search) {
            $where[] = 'domain LIKE ?';
            $params[] = '%' . $search . '%';
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM blocked_email_domains $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get domains
        $params[] = $perPage;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT id, domain, type AS reason, added_at AS created_at FROM blocked_email_domains
            $whereClause 
            ORDER BY added_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $domains = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'data' => $domains,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage)
        ]);
    }
    
    /**
     * Get single blocked domain
     */
    public function get(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $db = Database::getConnection();
        
        $stmt = $db->prepare("SELECT id, domain, type AS reason, added_at AS created_at FROM blocked_email_domains WHERE id = ?");
        $stmt->execute([$id]);
        $domain = $stmt->fetch();
        
        if (!$domain) {
            Response::error('Domain not found', 404);
            return;
        }
        
        Response::json($domain);
    }
    
    /**
     * Add a blocked domain
     */
    public function add(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $domain = trim($request->input('domain') ?? '');
        $reason = strtolower(trim($request->input('reason') ?? 'disposable'));
        $type = in_array($reason, ['disposable', 'role'], true) ? $reason : 'disposable';
        
        if (!$domain) {
            Response::error('Domain is required', 422);
            return;
        }
        
        // Validate domain format
        if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i', $domain)) {
            Response::error('Invalid domain format', 422);
            return;
        }
        
        $db = Database::getConnection();
        
        // Check if already blocked
        $stmt = $db->prepare("SELECT id FROM blocked_email_domains WHERE domain = ?");
        $stmt->execute([strtolower($domain)]);
        if ($stmt->fetch()) {
            Response::error('Domain is already blocked', 422);
            return;
        }
        
        try {
            $stmt = $db->prepare("
                INSERT INTO blocked_email_domains (domain, type, added_at)
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([strtolower($domain), $type]);
            
            $domainId = $db->lastInsertId();
            
            // Log the action
            AdminActivityLogger::logSubmission('blocked_domain_added', (int)$domainId, [
                'domain' => $domain,
                'reason' => $reason
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Domain blocked successfully',
                'domain_id' => $domainId
            ], 201);
        } catch (Exception $e) {
            error_log("Error adding blocked domain: " . $e->getMessage());
            Response::error('Failed to block domain', 500);
        }
    }
    
    /**
     * Bulk add blocked domains
     */
    public function bulkAdd(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $domains = $request->input('domains') ?? [];
        
        if (!is_array($domains) || empty($domains)) {
            Response::error('Domains array is required', 422);
            return;
        }
        
        $db = Database::getConnection();
        
        $added = 0;
        $skipped = 0;
        $errors = [];
        
        try {
            foreach ($domains as $entry) {
                $domain = trim($entry['domain'] ?? $entry ?? '');
                $reason = strtolower(trim($entry['reason'] ?? 'disposable'));
                $type = in_array($reason, ['disposable', 'role'], true) ? $reason : 'disposable';
                
                if (!$domain) {
                    $skipped++;
                    continue;
                }
                
                // Validate domain format
                if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i', $domain)) {
                    $errors[] = ['domain' => $domain, 'error' => 'Invalid format'];
                    $skipped++;
                    continue;
                }
                
                // Check if already blocked
                $stmt = $db->prepare("SELECT id FROM blocked_email_domains WHERE domain = ?");
                $stmt->execute([strtolower($domain)]);
                if ($stmt->fetch()) {
                    $skipped++;
                    continue;
                }
                
                // Add the domain
                $stmt = $db->prepare("
                    INSERT INTO blocked_email_domains (domain, type, added_at)
                    VALUES (?, ?, NOW())
                ");
                $stmt->execute([strtolower($domain), $type]);
                $added++;
            }
            
            // Log the bulk action
            AdminActivityLogger::logSubmission('blocked_domains_bulk_added', 0, [
                'added_count' => $added,
                'skipped_count' => $skipped
            ]);
            
            Response::json([
                'success' => true,
                'message' => "Bulk import complete",
                'added' => $added,
                'skipped' => $skipped,
                'errors' => $errors
            ]);
        } catch (Exception $e) {
            error_log("Error in bulk add blocked domains: " . $e->getMessage());
            Response::error('Failed to bulk add domains', 500);
        }
    }
    
    /**
     * Update blocked domain reason
     */
    public function update(array $params): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $id = (int) ($params['id'] ?? 0);
        $request = new Request();
        $reason = strtolower(trim($request->input('reason') ?? 'disposable'));
        $type = in_array($reason, ['disposable', 'role'], true) ? $reason : 'disposable';
        
        $db = Database::getConnection();
        
        // Check if domain exists
        $stmt = $db->prepare("SELECT id, domain, type AS reason, added_at AS created_at FROM blocked_email_domains WHERE id = ?");
        $stmt->execute([$id]);
        $domain = $stmt->fetch();
        
        if (!$domain) {
            Response::error('Domain not found', 404);
            return;
        }
        
        try {
            $stmt = $db->prepare("
                UPDATE blocked_email_domains 
                SET type = ?
                WHERE id = ?
            ");
            $stmt->execute([$type, $id]);
            
            // Log the update
            AdminActivityLogger::logSubmission('blocked_domain_updated', (int)$id, [
                'domain' => $domain['domain'],
                'new_reason' => $reason
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Domain updated successfully'
            ]);
        } catch (Exception $e) {
            error_log("Error updating blocked domain: " . $e->getMessage());
            Response::error('Failed to update domain', 500);
        }
    }
    
    /**
     * Remove a blocked domain
     */
    public function remove(array $params): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $id = (int) ($params['id'] ?? 0);
        $db = Database::getConnection();
        
        // Get domain info for logging
        $stmt = $db->prepare("SELECT domain FROM blocked_email_domains WHERE id = ?");
        $stmt->execute([$id]);
        $domain = $stmt->fetch();
        
        if (!$domain) {
            Response::error('Domain not found', 404);
            return;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM blocked_email_domains WHERE id = ?");
            $stmt->execute([$id]);
            
            // Log the removal
            AdminActivityLogger::logSubmission('blocked_domain_removed', (int)$id, [
                'domain' => $domain['domain']
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Domain unblocked successfully'
            ]);
        } catch (Exception $e) {
            error_log("Error removing blocked domain: " . $e->getMessage());
            Response::error('Failed to unblock domain', 500);
        }
    }
    
    /**
     * Bulk remove domains
     */
    public function bulkRemove(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $ids = $request->input('ids') ?? [];
        
        if (!is_array($ids) || empty($ids)) {
            Response::error('IDs array is required', 422);
            return;
        }
        
        $db = Database::getConnection();
        
        try {
            // Create placeholder for IN clause
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            
            // Delete domains
            $stmt = $db->prepare("DELETE FROM blocked_email_domains WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            
            $count = $stmt->rowCount();
            
            // Log the bulk action
            AdminActivityLogger::logSubmission('blocked_domains_bulk_removed', 0, [
                'removed_count' => $count
            ]);
            
            Response::json([
                'success' => true,
                'message' => "Removed $count domain(s)",
                'count' => $count
            ]);
        } catch (Exception $e) {
            error_log("Error in bulk remove blocked domains: " . $e->getMessage());
            Response::error('Failed to bulk remove domains', 500);
        }
    }
    
    /**
     * Check if a domain is blocked
     */
    public function isBlocked(): void {
        $request = new Request();
        $domain = $request->query('domain') ?? $request->input('domain');
        
        if (!$domain) {
            Response::error('Domain is required', 422);
            return;
        }
        
        $db = Database::getConnection();
        
        $stmt = $db->prepare("SELECT id, type AS reason FROM blocked_email_domains WHERE domain = ?");
        $stmt->execute([strtolower(trim($domain))]);
        $blockedDomain = $stmt->fetch();
        
        Response::json([
            'is_blocked' => $blockedDomain ? true : false,
            'reason' => $blockedDomain['reason'] ?? null
        ]);
    }
    
    /**
     * Export blocked domains as CSV/JSON
     */
    public function export(): void {
        // Verify admin token
        if (!AdminController::verifyAdminToken()) {
            return;
        }
        
        $request = new Request();
        $format = $request->query('format') ?? 'json'; // json, csv
        
        $db = Database::getConnection();
        
        $stmt = $db->query("SELECT domain, type AS reason, added_at AS created_at FROM blocked_email_domains ORDER BY domain ASC");
        $domains = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($format === 'csv') {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="blocked_domains_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Domain', 'Reason', 'Date Blocked']);
            
            foreach ($domains as $domain) {
                fputcsv($output, [
                    $domain['domain'],
                    $domain['reason'] ?? '',
                    $domain['created_at'] ?? ''
                ]);
            }
            
            fclose($output);
            exit;
        } else {
            Response::json([
                'total' => count($domains),
                'data' => $domains,
                'exported_at' => date('Y-m-d H:i:s')
            ]);
        }
    }
}
