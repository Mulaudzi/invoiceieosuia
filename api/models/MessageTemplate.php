<?php

class MessageTemplate extends Model {
    protected static string $table = 'message_templates';
    protected static array $fillable = [
        'user_id', 'name', 'type', 'category', 'subject', 'content', 'is_default', 'status'
    ];
    
    /**
     * Get templates by type (email or sms)
     */
    public function getByType(int $userId, string $type): array {
        return $this->where('user_id', $userId)
            ->where('type', $type)
            ->orderBy('category', 'ASC')
            ->get();
    }
    
    /**
     * Get default template for a category
     */
    public function getDefault(int $userId, string $type, string $category): ?array {
        return $this->where('user_id', $userId)
            ->where('type', $type)
            ->where('category', $category)
            ->where('is_default', 1)
            ->first();
    }
    
    /**
     * Set as default (unset other defaults of same type/category)
     */
    public function setAsDefault(int $templateId, int $userId, string $type, string $category): void {
        // Unset other defaults
        $db = Database::getConnection();
        $stmt = $db->prepare(
            "UPDATE " . static::$table . " 
             SET is_default = 0 
             WHERE user_id = ? AND type = ? AND category = ? AND id != ?"
        );
        $stmt->execute([$userId, $type, $category, $templateId]);
        
        // Set this one as default
        $this->update($templateId, ['is_default' => 1]);
    }
    
    /**
     * Default email templates
     */
    public static function getDefaultEmailTemplates(): array {
        return [
            [
                'name' => 'Invoice Notification',
                'type' => 'email',
                'category' => 'invoice',
                'subject' => 'Invoice {{invoice_number}} from {{business_name}}',
                'content' => "Dear {{client_name}},\n\nPlease find attached your invoice {{invoice_number}} for {{amount}}.\n\nDue Date: {{due_date}}\n\n{{custom_message}}\n\nThank you for your business!\n\nBest regards,\n{{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Payment Reminder',
                'type' => 'email',
                'category' => 'reminder',
                'subject' => 'Reminder: Invoice {{invoice_number}} Due {{due_date}}',
                'content' => "Dear {{client_name}},\n\nThis is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nPlease arrange payment at your earliest convenience.\n\nIf you have already made the payment, please disregard this reminder.\n\nThank you,\n{{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Overdue Notice',
                'type' => 'email',
                'category' => 'overdue',
                'subject' => 'OVERDUE: Invoice {{invoice_number}} - Payment Required',
                'content' => "Dear {{client_name}},\n\nThis is to notify you that invoice {{invoice_number}} for {{amount}} is now overdue.\n\nOriginal Due Date: {{due_date}}\nDays Overdue: {{days_overdue}}\n\nPlease make payment immediately to avoid any further action.\n\nIf you have any questions, please contact us.\n\n{{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Payment Received',
                'type' => 'email',
                'category' => 'thank_you',
                'subject' => 'Thank You! Payment Received for Invoice {{invoice_number}}',
                'content' => "Dear {{client_name}},\n\nThank you for your payment of {{amount}} for invoice {{invoice_number}}.\n\nWe appreciate your prompt payment and look forward to working with you again.\n\nBest regards,\n{{business_name}}",
                'is_default' => 1,
            ],
        ];
    }
    
    /**
     * Default SMS templates
     */
    public static function getDefaultSmsTemplates(): array {
        return [
            [
                'name' => 'Invoice Sent',
                'type' => 'sms',
                'category' => 'invoice',
                'subject' => '',
                'content' => "Hi {{client_name}}, invoice {{invoice_number}} for {{amount}} has been sent. Due: {{due_date}}. Check your email for details. - {{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Payment Reminder',
                'type' => 'sms',
                'category' => 'reminder',
                'subject' => '',
                'content' => "Reminder: Invoice {{invoice_number}} for {{amount}} is due on {{due_date}}. Please arrange payment. Questions? Reply to this message. - {{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Overdue Notice',
                'type' => 'sms',
                'category' => 'overdue',
                'subject' => '',
                'content' => "URGENT: Invoice {{invoice_number}} for {{amount}} is {{days_overdue}} days overdue. Please pay immediately to avoid action. - {{business_name}}",
                'is_default' => 1,
            ],
            [
                'name' => 'Payment Received',
                'type' => 'sms',
                'category' => 'thank_you',
                'subject' => '',
                'content' => "Thank you! Payment of {{amount}} received for invoice {{invoice_number}}. We appreciate your business. - {{business_name}}",
                'is_default' => 1,
            ],
        ];
    }
}
