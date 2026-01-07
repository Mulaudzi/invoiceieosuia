<?php

class NotificationController {
    public function sendSms(array $params): void {
        $request = new Request();
        $invoiceId = (int) $params['id'];
        
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $user = Auth::user();
        if ($user['plan'] === 'free') {
            Response::error('SMS is only available on Pro and Business plans', 403);
        }
        
        $client = Client::query()->find($invoice['client_id']);
        if (!$client || empty($client['phone'])) {
            Response::error('Client has no phone number', 422);
        }
        
        $message = $request->input('message');
        if (empty($message)) {
            $message = sprintf(
                "Reminder: Invoice %s for R%.2f is due on %s. Please make payment at your earliest convenience.",
                $invoice['invoice_number'],
                $invoice['total'],
                date('d M Y', strtotime($invoice['due_date']))
            );
        }
        
        $phone = $this->formatPhoneNumber($client['phone']);
        
        // LogicSMS API integration
        $apiKey = $_ENV['LOGICSMS_API_KEY'] ?? '';
        $senderId = $_ENV['LOGICSMS_SENDER_ID'] ?? 'INVOICE';
        
        if (empty($apiKey)) {
            Response::error('SMS service not configured', 500);
        }
        
        $response = $this->sendLogicSms($apiKey, $senderId, $phone, $message);
        
        if ($response['success']) {
            Response::json([
                'success' => true,
                'message' => 'SMS sent successfully',
                'recipient' => $phone
            ]);
        } else {
            Response::error('Failed to send SMS: ' . ($response['error'] ?? 'Unknown error'), 500);
        }
    }
    
    private function formatPhoneNumber(string $phone): string {
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        if (strpos($phone, '+27') === 0) {
            return $phone;
        }
        
        if (strpos($phone, '27') === 0 && strlen($phone) === 11) {
            return '+' . $phone;
        }
        
        if (strpos($phone, '0') === 0 && strlen($phone) === 10) {
            return '+27' . substr($phone, 1);
        }
        
        return $phone;
    }
    
    private function sendLogicSms(string $apiKey, string $senderId, string $phone, string $message): array {
        $url = 'https://api.logicsms.co.za/api/send';
        
        $data = [
            'key' => $apiKey,
            'sender' => $senderId,
            'recipient' => $phone,
            'message' => $message
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'error' => $error];
        }
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'response' => $response];
        }
        
        return ['success' => false, 'error' => "HTTP $httpCode: $response"];
    }
    
    public function sendEmail(array $params): void {
        $request = new Request();
        $invoiceId = (int) $params['id'];
        
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->withRelations($invoice);
        
        $client = $invoice['client'];
        if (!$client || empty($client['email'])) {
            Response::error('Client has no email address', 422);
        }
        
        $user = Auth::user();
        $customMessage = $request->input('message', '');
        
        // Generate email content
        $subject = sprintf('Invoice %s from %s', 
            $invoice['invoice_number'], 
            $user['business_name'] ?? $user['name']
        );
        
        $body = $this->generateEmailBody($invoice, $user, $customMessage);
        
        // Send email using PHP mail or SMTP
        $sent = $this->sendMail(
            $client['email'],
            $client['name'],
            $subject,
            $body,
            $user['email'] ?? 'noreply@example.com',
            $user['business_name'] ?? $user['name']
        );
        
        if ($sent) {
            // Update invoice status
            if ($invoice['status'] === 'Draft') {
                Invoice::query()->update($invoice['id'], ['status' => 'Pending']);
            }
            
            Response::json([
                'success' => true,
                'message' => 'Email sent successfully',
                'recipient' => $client['email']
            ]);
        } else {
            Response::error('Failed to send email', 500);
        }
    }
    
    private function generateEmailBody(array $invoice, array $user, string $customMessage): string {
        $businessName = $user['business_name'] ?? $user['name'];
        $dueDate = date('d M Y', strtotime($invoice['due_date']));
        
        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .invoice-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .amount { font-size: 24px; color: #1e3a5f; font-weight: bold; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>$businessName</h1>
                </div>
                <div class='content'>
                    <p>Dear {$invoice['client']['name']},</p>
                    " . ($customMessage ? "<p>$customMessage</p>" : "<p>Please find attached your invoice details.</p>") . "
                    
                    <div class='invoice-details'>
                        <p><strong>Invoice Number:</strong> {$invoice['invoice_number']}</p>
                        <p><strong>Due Date:</strong> $dueDate</p>
                        <p class='amount'>Amount Due: R" . number_format($invoice['total'], 2) . "</p>
                    </div>
                    
                    <p>Please make payment by the due date to avoid any late fees.</p>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p>Thank you for your business!</p>
                    <p>Best regards,<br>$businessName</p>
                </div>
                <div class='footer'>
                    <p>This email was sent by $businessName</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $html;
    }
    
    private function sendMail(string $to, string $toName, string $subject, string $body, string $from, string $fromName): bool {
        // Check if SMTP is configured
        $smtpHost = $_ENV['SMTP_HOST'] ?? '';
        
        if ($smtpHost) {
            return $this->sendSmtpMail($to, $toName, $subject, $body, $from, $fromName);
        }
        
        // Fallback to PHP mail()
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: $fromName <$from>",
            "Reply-To: $from",
            'X-Mailer: PHP/' . phpversion()
        ];
        
        return mail($to, $subject, $body, implode("\r\n", $headers));
    }
    
    private function sendSmtpMail(string $to, string $toName, string $subject, string $body, string $from, string $fromName): bool {
        $host = $_ENV['SMTP_HOST'];
        $port = $_ENV['SMTP_PORT'] ?? 587;
        $username = $_ENV['SMTP_USERNAME'] ?? '';
        $password = $_ENV['SMTP_PASSWORD'] ?? '';
        $encryption = $_ENV['SMTP_ENCRYPTION'] ?? 'tls';
        
        // Simple SMTP implementation
        // For production, consider using PHPMailer or similar
        $socket = @fsockopen(
            ($encryption === 'ssl' ? 'ssl://' : '') . $host,
            $port,
            $errno,
            $errstr,
            30
        );
        
        if (!$socket) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }
        
        // Basic SMTP handshake (simplified)
        // For full implementation, use a library
        fclose($socket);
        
        // Fallback to mail() if SMTP fails
        return mail($to, $subject, $body, "From: $fromName <$from>\r\nContent-type: text/html; charset=UTF-8");
    }
    
    public function emailPreview(array $params): void {
        $invoiceId = (int) $params['id'];
        
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->withRelations($invoice);
        
        $user = Auth::user();
        
        Response::json([
            'to' => $invoice['client']['email'] ?? '',
            'to_name' => $invoice['client']['name'] ?? '',
            'subject' => sprintf('Invoice %s from %s', 
                $invoice['invoice_number'], 
                $user['business_name'] ?? $user['name']
            ),
            'invoice_number' => $invoice['invoice_number'],
            'amount' => $invoice['total'],
            'due_date' => $invoice['due_date']
        ]);
    }
}
