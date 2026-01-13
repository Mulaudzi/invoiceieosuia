<?php

/**
 * Billing Portal Controller
 * Manages payment methods and billing history for users
 */
class BillingController {
    
    /**
     * Get billing portal data (subscription, payment methods)
     * GET /api/billing/portal
     */
    public function getPortal(): void {
        $userId = Auth::id();
        $user = User::query()->find($userId);
        
        if (!$user) {
            Response::error('User not found', 404);
        }
        
        $db = Database::getConnection();
        
        // Get payment methods
        $stmt = $db->prepare("
            SELECT id, type, last_four, brand, expiry_month, expiry_year, is_default, created_at
            FROM payment_methods
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
        ");
        $stmt->execute([$userId]);
        $paymentMethods = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get subscription details
        $subscription = [
            'plan' => $user['plan'] ?? 'free',
            'status' => $user['plan'] !== 'free' ? 'active' : 'free',
            'current_period_end' => $user['subscription_renewal_date'] ?? null,
            'cancel_at_period_end' => false,
            'next_billing_amount' => $this->getPlanPrice($user['plan'] ?? 'free'),
        ];
        
        // Check if subscription is cancelled
        $stmt = $db->prepare("
            SELECT status FROM subscription_history 
            WHERE user_id = ? AND status = 'cancelled' 
            ORDER BY ended_at DESC LIMIT 1
        ");
        $stmt->execute([$userId]);
        $cancelledSub = $stmt->fetch();
        
        if ($cancelledSub && $user['plan'] !== 'free') {
            $subscription['cancel_at_period_end'] = true;
        }
        
        Response::json([
            'subscription' => $subscription,
            'payment_methods' => $paymentMethods,
        ]);
    }
    
    /**
     * Get transaction history
     * GET /api/billing/transactions
     */
    public function getTransactions(): void {
        $userId = Auth::id();
        $db = Database::getConnection();
        
        $request = new Request();
        $limit = (int)($request->query('limit') ?? 50);
        $offset = (int)($request->query('offset') ?? 0);
        
        $stmt = $db->prepare("
            SELECT 
                pt.id,
                CASE 
                    WHEN pt.plan IS NOT NULL AND pt.plan != 'invoice' THEN 'subscription'
                    ELSE 'invoice'
                END as type,
                CASE 
                    WHEN pt.plan IS NOT NULL AND pt.plan != 'invoice' THEN CONCAT(UPPER(LEFT(pt.plan, 1)), SUBSTRING(pt.plan, 2), ' Plan Subscription')
                    ELSE CONCAT('Invoice Payment #', pt.invoice_id)
                END as description,
                pt.amount,
                pt.status,
                pt.gateway as payment_method,
                pt.created_at,
                pt.completed_at
            FROM payment_transactions pt
            WHERE pt.user_id = ?
            ORDER BY pt.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, $limit, $offset]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM payment_transactions WHERE user_id = ?");
        $countStmt->execute([$userId]);
        $total = $countStmt->fetch()['total'];
        
        Response::json([
            'data' => $transactions,
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }
    
    /**
     * Set default payment method
     * POST /api/billing/payment-methods/{id}/default
     */
    public function setDefaultPaymentMethod(): void {
        $userId = Auth::id();
        $paymentMethodId = (int)Request::param('id');
        
        $db = Database::getConnection();
        
        // Verify ownership
        $stmt = $db->prepare("SELECT id FROM payment_methods WHERE id = ? AND user_id = ?");
        $stmt->execute([$paymentMethodId, $userId]);
        
        if (!$stmt->fetch()) {
            Response::error('Payment method not found', 404);
        }
        
        // Begin transaction
        $db->beginTransaction();
        
        try {
            // Remove default from all
            $stmt = $db->prepare("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Set new default
            $stmt = $db->prepare("UPDATE payment_methods SET is_default = 1 WHERE id = ?");
            $stmt->execute([$paymentMethodId]);
            
            $db->commit();
            
            Response::json(['success' => true, 'message' => 'Default payment method updated']);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to update payment method', 500);
        }
    }
    
    /**
     * Remove payment method
     * DELETE /api/billing/payment-methods/{id}
     */
    public function removePaymentMethod(): void {
        $userId = Auth::id();
        $paymentMethodId = (int)Request::param('id');
        
        $db = Database::getConnection();
        
        // Verify ownership and check if default
        $stmt = $db->prepare("SELECT id, is_default FROM payment_methods WHERE id = ? AND user_id = ?");
        $stmt->execute([$paymentMethodId, $userId]);
        $method = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$method) {
            Response::error('Payment method not found', 404);
        }
        
        // Check if there are other payment methods
        $countStmt = $db->prepare("SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?");
        $countStmt->execute([$userId]);
        $count = $countStmt->fetch()['count'];
        
        // If this is the default and there are other methods, prevent deletion
        if ($method['is_default'] && $count > 1) {
            Response::error('Cannot delete default payment method. Set another method as default first.', 422);
        }
        
        // Delete the payment method
        $stmt = $db->prepare("DELETE FROM payment_methods WHERE id = ?");
        $stmt->execute([$paymentMethodId]);
        
        Response::json(['success' => true, 'message' => 'Payment method removed']);
    }
    
    /**
     * Add payment method (called after successful payment gateway tokenization)
     * POST /api/billing/payment-methods
     */
    public function addPaymentMethod(): void {
        $userId = Auth::id();
        $request = new Request();
        
        $type = $request->input('type') ?? 'card';
        $lastFour = $request->input('last_four');
        $brand = $request->input('brand');
        $expiryMonth = $request->input('expiry_month');
        $expiryYear = $request->input('expiry_year');
        $token = $request->input('token'); // Payment gateway token
        $gateway = $request->input('gateway') ?? 'payfast';
        
        if (!$lastFour) {
            Response::error('Card details required', 422);
        }
        
        $db = Database::getConnection();
        
        // Check if this card already exists
        $stmt = $db->prepare("
            SELECT id FROM payment_methods 
            WHERE user_id = ? AND last_four = ? AND type = ?
        ");
        $stmt->execute([$userId, $lastFour, $type]);
        
        if ($stmt->fetch()) {
            Response::error('This payment method already exists', 422);
        }
        
        // Check if user has any payment methods (first one becomes default)
        $countStmt = $db->prepare("SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?");
        $countStmt->execute([$userId]);
        $isFirst = $countStmt->fetch()['count'] == 0;
        
        // Insert new payment method
        $stmt = $db->prepare("
            INSERT INTO payment_methods 
            (user_id, type, last_four, brand, expiry_month, expiry_year, token, gateway, is_default, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $type,
            $lastFour,
            $brand,
            $expiryMonth,
            $expiryYear,
            $token,
            $gateway,
            $isFirst ? 1 : 0
        ]);
        
        Response::json([
            'success' => true,
            'id' => $db->lastInsertId(),
            'message' => 'Payment method added'
        ], 201);
    }
    
    /**
     * Download invoice PDF for a transaction
     * GET /api/billing/transactions/{id}/invoice
     */
    public function downloadInvoice(): void {
        $userId = Auth::id();
        $transactionId = (int)Request::param('id');
        
        $db = Database::getConnection();
        
        // Get transaction
        $stmt = $db->prepare("
            SELECT pt.*, u.name, u.email, u.business_name, u.address
            FROM payment_transactions pt
            JOIN users u ON pt.user_id = u.id
            WHERE pt.id = ? AND pt.user_id = ? AND pt.status = 'completed'
        ");
        $stmt->execute([$transactionId, $userId]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaction) {
            Response::error('Transaction not found or not eligible for invoice', 404);
        }
        
        // Generate PDF using FPDF
        require_once __DIR__ . '/../lib/FPDF.php';
        
        $pdf = new \FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 20);
        
        // Header
        $pdf->Cell(0, 10, 'INVOICE', 0, 1, 'C');
        $pdf->SetFont('Arial', '', 12);
        $pdf->Ln(10);
        
        // Invoice details
        $pdf->Cell(0, 8, 'Invoice #: INV-' . str_pad($transaction['id'], 6, '0', STR_PAD_LEFT), 0, 1);
        $pdf->Cell(0, 8, 'Date: ' . date('F j, Y', strtotime($transaction['completed_at'] ?? $transaction['created_at'])), 0, 1);
        $pdf->Ln(10);
        
        // Bill to
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 8, 'Bill To:', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 6, $transaction['business_name'] ?: $transaction['name'], 0, 1);
        $pdf->Cell(0, 6, $transaction['email'], 0, 1);
        if ($transaction['address']) {
            $pdf->MultiCell(0, 6, $transaction['address'], 0);
        }
        $pdf->Ln(10);
        
        // Table header
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(100, 10, 'Description', 1);
        $pdf->Cell(45, 10, 'Amount', 1, 0, 'R');
        $pdf->Cell(45, 10, 'Total', 1, 0, 'R');
        $pdf->Ln();
        
        // Table row
        $pdf->SetFont('Arial', '', 12);
        $description = $transaction['plan'] !== 'invoice' 
            ? ucfirst($transaction['plan']) . ' Plan Subscription'
            : 'Invoice Payment';
        $pdf->Cell(100, 10, $description, 1);
        $pdf->Cell(45, 10, 'R ' . number_format($transaction['amount'], 2), 1, 0, 'R');
        $pdf->Cell(45, 10, 'R ' . number_format($transaction['amount'], 2), 1, 0, 'R');
        $pdf->Ln(20);
        
        // Total
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->Cell(145, 10, 'Total:', 0, 0, 'R');
        $pdf->Cell(45, 10, 'R ' . number_format($transaction['amount'], 2), 0, 0, 'R');
        $pdf->Ln(20);
        
        // Footer
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(0, 8, 'Payment Method: ' . ucfirst($transaction['gateway'] ?? 'Online'), 0, 1);
        $pdf->Cell(0, 8, 'Transaction ID: ' . ($transaction['merchant_payment_id'] ?? $transaction['payment_id']), 0, 1);
        $pdf->Cell(0, 8, 'Status: Paid', 0, 1);
        $pdf->Ln(10);
        $pdf->Cell(0, 8, 'Thank you for your business!', 0, 1, 'C');
        
        // Output
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="invoice-' . $transactionId . '.pdf"');
        echo $pdf->Output('S');
        exit;
    }
    
    /**
     * Get plan price
     */
    private function getPlanPrice(string $plan): int {
        $prices = [
            'free' => 0,
            'solo' => 149,
            'pro' => 299,
            'business' => 599,
            'enterprise' => 999,
        ];
        
        return $prices[$plan] ?? 0;
    }
    
    /**
     * Get payment retry status for user
     * GET /api/billing/retry-status
     */
    public function getRetryStatus(): void {
        $userId = Auth::id();
        $db = Database::getConnection();
        
        // Get user grace period info
        $user = User::query()->find($userId);
        
        // Get failed transactions that are pending retry
        $stmt = $db->prepare("
            SELECT 
                id, 
                amount, 
                plan, 
                failure_reason, 
                retry_count, 
                max_retries,
                next_retry_at,
                created_at
            FROM payment_transactions
            WHERE user_id = ? 
            AND status = 'failed'
            AND (retry_count < max_retries OR max_retries IS NULL)
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$userId]);
        $failedTransactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $hasFailedPayments = !empty($failedTransactions);
        $latestFailure = $failedTransactions[0] ?? null;
        
        Response::json([
            'has_failed_payments' => $hasFailedPayments,
            'failed_count' => count($failedTransactions),
            'grace_until' => $user['subscription_grace_until'] ?? null,
            'next_retry_at' => $latestFailure['next_retry_at'] ?? null,
            'latest_failure' => $latestFailure ? [
                'id' => (int)$latestFailure['id'],
                'amount' => (float)$latestFailure['amount'],
                'plan' => $latestFailure['plan'],
                'failure_reason' => $latestFailure['failure_reason'],
                'retry_count' => (int)($latestFailure['retry_count'] ?? 0),
                'max_retries' => (int)($latestFailure['max_retries'] ?? 3),
            ] : null,
        ]);
    }
}
