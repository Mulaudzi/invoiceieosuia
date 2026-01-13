<?php

class UserNotificationController {
    
    /**
     * Get all notifications for the authenticated user
     */
    public function index(): void {
        $userId = Auth::id();
        
        $db = Database::getInstance();
        $notifications = $db->fetchAll(
            "SELECT id, message, type, is_read, related_type, related_id, created_at, read_at 
             FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50",
            [$userId]
        );
        
        // Transform to frontend format
        $formatted = array_map(function($n) {
            return [
                'id' => (string) $n['id'],
                'message' => $n['message'],
                'date' => $n['created_at'],
                'read' => (bool) $n['is_read'],
                'type' => $n['type'] ?? 'info',
                'relatedType' => $n['related_type'],
                'relatedId' => $n['related_id'],
            ];
        }, $notifications);
        
        $unreadCount = count(array_filter($formatted, fn($n) => !$n['read']));
        
        Response::json([
            'notifications' => $formatted,
            'unread_count' => $unreadCount
        ]);
    }
    
    /**
     * Mark a single notification as read
     */
    public function markAsRead(array $params): void {
        $userId = Auth::id();
        $notificationId = (int) $params['id'];
        
        $db = Database::getInstance();
        
        // Verify ownership
        $notification = $db->fetch(
            "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
            [$notificationId, $userId]
        );
        
        if (!$notification) {
            Response::error('Notification not found', 404);
        }
        
        $db->query(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?",
            [$notificationId]
        );
        
        Response::json(['success' => true]);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): void {
        $userId = Auth::id();
        
        $db = Database::getInstance();
        $db->query(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE",
            [$userId]
        );
        
        Response::json(['success' => true]);
    }
    
    /**
     * Delete a notification
     */
    public function delete(array $params): void {
        $userId = Auth::id();
        $notificationId = (int) $params['id'];
        
        $db = Database::getInstance();
        
        // Verify ownership
        $notification = $db->fetch(
            "SELECT id FROM notifications WHERE id = ? AND user_id = ?",
            [$notificationId, $userId]
        );
        
        if (!$notification) {
            Response::error('Notification not found', 404);
        }
        
        $db->query("DELETE FROM notifications WHERE id = ?", [$notificationId]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Clear all notifications for the user
     */
    public function clearAll(): void {
        $userId = Auth::id();
        
        $db = Database::getInstance();
        $db->query("DELETE FROM notifications WHERE user_id = ?", [$userId]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Create a notification (internal use or admin)
     */
    public static function create(int $userId, string $message, string $type = 'info', ?string $relatedType = null, ?int $relatedId = null): int {
        $db = Database::getInstance();
        
        $db->query(
            "INSERT INTO notifications (user_id, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?)",
            [$userId, $message, $type, $relatedType, $relatedId]
        );
        
        return $db->lastInsertId();
    }
    
    /**
     * Helper to create common notification types
     */
    public static function notifyInvoicePaid(int $userId, string $invoiceNumber, string $clientName, int $invoiceId): void {
        self::create(
            $userId,
            "Invoice {$invoiceNumber} has been paid by {$clientName}.",
            'success',
            'invoice',
            $invoiceId
        );
    }
    
    public static function notifyInvoiceOverdue(int $userId, string $invoiceNumber, int $daysPastDue, int $invoiceId): void {
        self::create(
            $userId,
            "Invoice {$invoiceNumber} is overdue by {$daysPastDue} days.",
            'warning',
            'invoice',
            $invoiceId
        );
    }
    
    public static function notifyPaymentReceived(int $userId, float $amount, string $clientName, int $paymentId): void {
        self::create(
            $userId,
            sprintf("Payment of R%.2f received from %s.", $amount, $clientName),
            'success',
            'payment',
            $paymentId
        );
    }
    
    public static function notifyNewClient(int $userId, string $clientName, int $clientId): void {
        self::create(
            $userId,
            "New client \"{$clientName}\" has been added.",
            'info',
            'client',
            $clientId
        );
    }
    
    public static function notifyReminderSent(int $userId, string $clientName, string $invoiceNumber, int $invoiceId): void {
        self::create(
            $userId,
            "Payment reminder sent to {$clientName} for invoice {$invoiceNumber}.",
            'info',
            'invoice',
            $invoiceId
        );
    }
}