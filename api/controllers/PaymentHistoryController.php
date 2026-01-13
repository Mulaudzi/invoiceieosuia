<?php

/**
 * Payment History Controller
 * Retrieves payment transaction history for the authenticated user
 */
class PaymentHistoryController {
    
    /**
     * Get all payment transactions for the user
     * GET /api/payment-history
     */
    public function index(): void {
        $request = new Request();
        $db = Database::getConnection();
        
        $userId = Auth::id();
        
        // Build query with filters
        $sql = "
            SELECT 
                pt.*,
                i.invoice_number
            FROM payment_transactions pt
            LEFT JOIN invoices i ON pt.invoice_id = i.id
            WHERE pt.user_id = ?
        ";
        
        $params = [$userId];
        
        // Status filter
        $status = $request->query('status');
        if ($status) {
            $sql .= " AND pt.status = ?";
            $params[] = $status;
        }
        
        // Gateway filter
        $gateway = $request->query('gateway');
        if ($gateway) {
            $sql .= " AND pt.gateway = ?";
            $params[] = $gateway;
        }
        
        $sql .= " ORDER BY pt.created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Transform data
        $transactions = array_map(function($tx) {
            return [
                'id' => (int)$tx['id'],
                'user_id' => (int)$tx['user_id'],
                'plan' => $tx['plan'],
                'invoice_id' => $tx['invoice_id'] ? (int)$tx['invoice_id'] : null,
                'amount' => (float)$tx['amount'],
                'payment_id' => $tx['payment_id'],
                'merchant_payment_id' => $tx['merchant_payment_id'],
                'status' => $tx['status'],
                'payment_method' => $tx['payment_method'],
                'gateway' => $tx['gateway'],
                'created_at' => $tx['created_at'],
                'completed_at' => $tx['completed_at'],
                'invoice_number' => $tx['invoice_number'],
            ];
        }, $transactions);
        
        Response::json(['data' => $transactions]);
    }
    
    /**
     * Get transaction summary
     * GET /api/payment-history/summary
     */
    public function summary(): void {
        $db = Database::getConnection();
        $userId = Auth::id();
        
        // Get totals by status
        $stmt = $db->prepare("
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total
            FROM payment_transactions
            WHERE user_id = ?
            GROUP BY status
        ");
        $stmt->execute([$userId]);
        $byStatus = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Get totals by gateway
        $stmt = $db->prepare("
            SELECT 
                gateway,
                COUNT(*) as count,
                SUM(amount) as total
            FROM payment_transactions
            WHERE user_id = ? AND status = 'completed'
            GROUP BY gateway
        ");
        $stmt->execute([$userId]);
        $byGateway = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Get recent transactions
        $stmt = $db->prepare("
            SELECT * FROM payment_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$userId]);
        $recent = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        Response::json([
            'by_status' => $byStatus,
            'by_gateway' => $byGateway,
            'recent' => $recent,
        ]);
    }
}
