<?php

class ReminderController {
    
    public function index(): void {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT r.*, i.invoice_number, i.total, i.due_date, c.name as client_name
            FROM invoice_reminders r
            JOIN invoices i ON r.invoice_id = i.id
            JOIN clients c ON i.client_id = c.id
            WHERE r.user_id = ?
            ORDER BY r.scheduled_for DESC
            LIMIT 50
        ");
        $stmt->execute([Auth::id()]);
        $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['data' => $reminders]);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'invoice_id' => 'required|numeric',
            'reminder_type' => 'required',
            'days_offset' => 'required|numeric',
        ]);
        
        // Verify invoice ownership
        $invoice = Invoice::query()->find($data['invoice_id']);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        // Calculate scheduled time
        $dueDate = new DateTime($invoice['due_date']);
        $offset = (int) $data['days_offset'];
        
        if ($data['reminder_type'] === 'before_due') {
            $dueDate->modify("-{$offset} days");
        } elseif ($data['reminder_type'] === 'after_due') {
            $dueDate->modify("+{$offset} days");
        }
        // 'on_due' keeps the same date
        
        $scheduledFor = $dueDate->format('Y-m-d 09:00:00'); // Schedule for 9 AM
        
        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO invoice_reminders (invoice_id, user_id, reminder_type, days_offset, scheduled_for)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['invoice_id'],
            Auth::id(),
            $data['reminder_type'],
            $data['days_offset'],
            $scheduledFor,
        ]);
        
        $reminderId = $db->lastInsertId();
        
        Response::json([
            'success' => true,
            'reminder_id' => $reminderId,
            'scheduled_for' => $scheduledFor,
        ], 201);
    }
    
    public function destroy(array $params): void {
        $id = (int) $params['id'];
        
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM invoice_reminders WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, Auth::id()]);
        $reminder = $stmt->fetch();
        
        if (!$reminder) {
            Response::error('Reminder not found', 404);
        }
        
        $stmt = $db->prepare("DELETE FROM invoice_reminders WHERE id = ?");
        $stmt->execute([$id]);
        
        Response::json(['success' => true, 'message' => 'Reminder deleted']);
    }
    
    public function scheduleForInvoice(array $params): void {
        $invoiceId = (int) $params['id'];
        
        // Verify invoice ownership
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        if ($invoice['status'] === 'Paid') {
            Response::error('Cannot schedule reminders for paid invoices', 422);
        }
        
        $request = new Request();
        $reminders = $request->input('reminders') ?? [];
        
        if (empty($reminders)) {
            // Default reminders: 3 days before, on due date, 7 days after
            $reminders = [
                ['type' => 'before_due', 'days' => 3],
                ['type' => 'on_due', 'days' => 0],
                ['type' => 'after_due', 'days' => 7],
            ];
        }
        
        $db = Database::getConnection();
        $dueDate = new DateTime($invoice['due_date']);
        $created = [];
        
        foreach ($reminders as $reminder) {
            $scheduledDate = clone $dueDate;
            $days = (int) ($reminder['days'] ?? 0);
            
            if ($reminder['type'] === 'before_due') {
                $scheduledDate->modify("-{$days} days");
            } elseif ($reminder['type'] === 'after_due') {
                $scheduledDate->modify("+{$days} days");
            }
            
            $scheduledFor = $scheduledDate->format('Y-m-d 09:00:00');
            
            // Don't schedule reminders in the past
            if (new DateTime($scheduledFor) <= new DateTime()) {
                continue;
            }
            
            $stmt = $db->prepare("
                INSERT INTO invoice_reminders (invoice_id, user_id, reminder_type, days_offset, scheduled_for)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $invoiceId,
                Auth::id(),
                $reminder['type'],
                $days,
                $scheduledFor,
            ]);
            
            $created[] = [
                'id' => $db->lastInsertId(),
                'type' => $reminder['type'],
                'days' => $days,
                'scheduled_for' => $scheduledFor,
            ];
        }
        
        Response::json([
            'success' => true,
            'message' => count($created) . ' reminders scheduled',
            'reminders' => $created,
        ]);
    }
    
    public function processPending(): void {
        // This should be called by a cron job (e.g., every hour)
        // Processes all pending reminders that are due
        
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT r.*, i.invoice_number, i.total, i.due_date, i.status as invoice_status,
                   c.name as client_name, c.email as client_email,
                   u.name as user_name, u.business_name, u.email as user_email
            FROM invoice_reminders r
            JOIN invoices i ON r.invoice_id = i.id
            JOIN clients c ON i.client_id = c.id
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending' 
            AND r.scheduled_for <= NOW()
            AND i.status != 'Paid'
            LIMIT 50
        ");
        $stmt->execute();
        $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $processed = 0;
        $errors = 0;
        
        foreach ($reminders as $reminder) {
            try {
                $sent = $this->sendReminderEmail($reminder);
                
                $status = $sent ? 'sent' : 'failed';
                $error = $sent ? null : 'Failed to send email';
                
                $updateStmt = $db->prepare("
                    UPDATE invoice_reminders 
                    SET status = ?, sent_at = NOW(), error_message = ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$status, $error, $reminder['id']]);
                
                if ($sent) {
                    $processed++;
                } else {
                    $errors++;
                }
            } catch (Exception $e) {
                $updateStmt = $db->prepare("
                    UPDATE invoice_reminders 
                    SET status = 'failed', error_message = ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$e->getMessage(), $reminder['id']]);
                $errors++;
            }
        }
        
        Response::json([
            'success' => true,
            'processed' => $processed,
            'errors' => $errors,
            'total' => count($reminders),
        ]);
    }
    
    private function sendReminderEmail(array $reminder): bool {
        $subject = $this->getReminderSubject($reminder);
        $body = $this->getReminderEmailBody($reminder);
        
        return Mailer::send($reminder['client_email'], $subject, $body);
    }
    
    private function getReminderSubject(array $reminder): string {
        $invoiceNumber = $reminder['invoice_number'];
        
        switch ($reminder['reminder_type']) {
            case 'before_due':
                return "Reminder: Invoice {$invoiceNumber} is due soon";
            case 'on_due':
                return "Invoice {$invoiceNumber} is due today";
            case 'after_due':
                return "Overdue: Invoice {$invoiceNumber} requires attention";
            default:
                return "Invoice {$invoiceNumber} Payment Reminder";
        }
    }
    
    private function getReminderEmailBody(array $reminder): string {
        $businessName = $reminder['business_name'] ?? $reminder['user_name'];
        $invoiceNumber = $reminder['invoice_number'];
        $amount = 'R' . number_format($reminder['total'], 2);
        $dueDate = date('d M Y', strtotime($reminder['due_date']));
        $clientName = $reminder['client_name'];
        $paymentUrl = ($_ENV['APP_URL'] ?? 'https://invoices.ieosuia.com') . '/pay/' . $reminder['invoice_id'];
        
        $urgencyClass = $reminder['reminder_type'] === 'after_due' ? 'color: #dc2626;' : '';
        $urgencyText = '';
        
        if ($reminder['reminder_type'] === 'before_due') {
            $urgencyText = "This is a friendly reminder that payment is due on <strong>{$dueDate}</strong>.";
        } elseif ($reminder['reminder_type'] === 'on_due') {
            $urgencyText = "This invoice is <strong>due today</strong>. Please arrange payment at your earliest convenience.";
        } else {
            $urgencyText = "<span style='{$urgencyClass}'><strong>This invoice is now overdue.</strong></span> Please arrange payment as soon as possible to avoid any late fees.";
        }
        
        return "
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a5f, #0d1f33); padding: 30px; text-align: center; }
                    .header h1 { color: #fff; margin: 0; font-size: 24px; }
                    .content { padding: 30px; }
                    .invoice-box { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .invoice-box .amount { font-size: 28px; font-weight: bold; color: #1e3a5f; }
                    .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>{$businessName}</h1>
                    </div>
                    <div class='content'>
                        <h2>Payment Reminder</h2>
                        <p>Dear {$clientName},</p>
                        <p>{$urgencyText}</p>
                        
                        <div class='invoice-box'>
                            <p><strong>Invoice:</strong> {$invoiceNumber}</p>
                            <p><strong>Due Date:</strong> {$dueDate}</p>
                            <p class='amount'>Amount Due: {$amount}</p>
                        </div>
                        
                        <p>Please contact us if you have any questions about this invoice.</p>
                        
                        <p>Thank you for your business!</p>
                        <p>Best regards,<br>{$businessName}</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated reminder from {$businessName}.</p>
                        <p>&copy; " . date('Y') . " IEOSUIA. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
    }
    
    public function getSettings(): void {
        $user = Auth::user();
        
        $settings = [];
        if (!empty($user['reminder_settings'])) {
            $settings = json_decode($user['reminder_settings'], true) ?? [];
        }
        
        // Default settings
        $defaults = [
            'enabled' => true,
            'before_due_days' => 3,
            'on_due' => true,
            'after_due_days' => [7, 14],
            'auto_schedule' => false,
        ];
        
        Response::json(['settings' => array_merge($defaults, $settings)]);
    }
    
    public function updateSettings(): void {
        $request = new Request();
        $settings = $request->input('settings') ?? [];
        
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE users SET reminder_settings = ? WHERE id = ?");
        $stmt->execute([json_encode($settings), Auth::id()]);
        
        Response::json(['success' => true, 'settings' => $settings]);
    }
}
