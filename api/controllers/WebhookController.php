<?php

/**
 * Webhook Controller
 * Handles incoming webhooks for email bounce/delivery notifications
 * Supports multiple email providers: SendGrid, Mailgun, Amazon SES, etc.
 */
class WebhookController {
    
    // Webhook secret for verification (set in .env)
    private string $webhookSecret;
    
    public function __construct() {
        $this->webhookSecret = $_ENV['EMAIL_WEBHOOK_SECRET'] ?? '';
    }
    
    /**
     * Handle email bounce webhooks
     * POST /api/webhooks/email-bounce
     */
    public function handleBounce(): void {
        $request = new Request();
        
        // Log the incoming webhook
        $this->logWebhook('bounce', $request->all());
        
        // Verify webhook signature if secret is set
        if (!empty($this->webhookSecret) && !$this->verifySignature($request)) {
            Response::error('Invalid webhook signature', 401);
            return;
        }
        
        $provider = $this->detectProvider($request);
        
        switch ($provider) {
            case 'sendgrid':
                $this->handleSendGridBounce($request);
                break;
            case 'mailgun':
                $this->handleMailgunBounce($request);
                break;
            case 'ses':
                $this->handleSesBounce($request);
                break;
            case 'postmark':
                $this->handlePostmarkBounce($request);
                break;
            default:
                $this->handleGenericBounce($request);
        }
        
        Response::json(['success' => true, 'message' => 'Webhook processed']);
    }
    
    /**
     * Handle email delivery webhooks
     * POST /api/webhooks/email-delivery
     */
    public function handleDelivery(): void {
        $request = new Request();
        
        $this->logWebhook('delivery', $request->all());
        
        if (!empty($this->webhookSecret) && !$this->verifySignature($request)) {
            Response::error('Invalid webhook signature', 401);
            return;
        }
        
        $provider = $this->detectProvider($request);
        
        switch ($provider) {
            case 'sendgrid':
                $this->handleSendGridDelivery($request);
                break;
            case 'mailgun':
                $this->handleMailgunDelivery($request);
                break;
            case 'ses':
                $this->handleSesDelivery($request);
                break;
            case 'postmark':
                $this->handlePostmarkDelivery($request);
                break;
            default:
                $this->handleGenericDelivery($request);
        }
        
        Response::json(['success' => true, 'message' => 'Webhook processed']);
    }
    
    /**
     * Handle spam complaint webhooks
     * POST /api/webhooks/email-complaint
     */
    public function handleComplaint(): void {
        $request = new Request();
        
        $this->logWebhook('complaint', $request->all());
        
        $data = $request->all();
        $email = $data['email'] ?? $data['recipient'] ?? null;
        
        if ($email) {
            $this->markEmailAsComplaint($email, $data);
        }
        
        Response::json(['success' => true, 'message' => 'Complaint processed']);
    }
    
    // ==================== Provider-Specific Handlers ====================
    
    /**
     * SendGrid Event Webhook Handler
     * Expects array of events: [{ email, event, sg_message_id, ... }]
     */
    private function handleSendGridBounce(Request $request): void {
        $events = $request->all();
        
        // SendGrid sends an array of events
        if (!is_array($events)) {
            $events = [$events];
        }
        
        foreach ($events as $event) {
            if (!isset($event['email'])) continue;
            
            $email = $event['email'];
            $eventType = $event['event'] ?? 'bounce';
            $reason = $event['reason'] ?? $event['response'] ?? 'Unknown bounce reason';
            $messageId = $event['sg_message_id'] ?? null;
            
            if (in_array($eventType, ['bounce', 'dropped', 'deferred'])) {
                $this->updateEmailStatus($email, 'bounced', $reason, $messageId, [
                    'provider' => 'sendgrid',
                    'event_type' => $eventType,
                    'timestamp' => $event['timestamp'] ?? time(),
                ]);
            }
        }
    }
    
    private function handleSendGridDelivery(Request $request): void {
        $events = $request->all();
        
        if (!is_array($events)) {
            $events = [$events];
        }
        
        foreach ($events as $event) {
            if (!isset($event['email'])) continue;
            
            $email = $event['email'];
            $eventType = $event['event'] ?? '';
            $messageId = $event['sg_message_id'] ?? null;
            
            if ($eventType === 'delivered') {
                $this->updateEmailStatus($email, 'sent', null, $messageId, [
                    'provider' => 'sendgrid',
                    'event_type' => 'delivered',
                    'timestamp' => $event['timestamp'] ?? time(),
                ]);
            }
        }
    }
    
    /**
     * Mailgun Event Webhook Handler
     */
    private function handleMailgunBounce(Request $request): void {
        $data = $request->all();
        $eventData = $data['event-data'] ?? $data;
        
        $email = $eventData['recipient'] ?? $data['recipient'] ?? null;
        $reason = $eventData['delivery-status']['description'] ?? 
                  $eventData['delivery-status']['message'] ?? 
                  'Mailgun bounce';
        $messageId = $eventData['message']['headers']['message-id'] ?? null;
        
        if ($email) {
            $this->updateEmailStatus($email, 'bounced', $reason, $messageId, [
                'provider' => 'mailgun',
                'event_type' => $eventData['event'] ?? 'bounce',
                'severity' => $eventData['severity'] ?? 'permanent',
            ]);
        }
    }
    
    private function handleMailgunDelivery(Request $request): void {
        $data = $request->all();
        $eventData = $data['event-data'] ?? $data;
        
        $email = $eventData['recipient'] ?? $data['recipient'] ?? null;
        $messageId = $eventData['message']['headers']['message-id'] ?? null;
        
        if ($email && ($eventData['event'] ?? '') === 'delivered') {
            $this->updateEmailStatus($email, 'sent', null, $messageId, [
                'provider' => 'mailgun',
                'event_type' => 'delivered',
            ]);
        }
    }
    
    /**
     * Amazon SES Event Webhook Handler
     */
    private function handleSesBounce(Request $request): void {
        $data = $request->all();
        
        // SES might send SNS notification wrapper
        if (isset($data['Message'])) {
            $data = json_decode($data['Message'], true) ?? $data;
        }
        
        $bounce = $data['bounce'] ?? null;
        if (!$bounce) return;
        
        $recipients = $bounce['bouncedRecipients'] ?? [];
        $bounceType = $bounce['bounceType'] ?? 'Permanent';
        $bounceSubType = $bounce['bounceSubType'] ?? 'General';
        $messageId = $data['mail']['messageId'] ?? null;
        
        foreach ($recipients as $recipient) {
            $email = $recipient['emailAddress'] ?? null;
            $reason = $recipient['diagnosticCode'] ?? "$bounceType - $bounceSubType";
            
            if ($email) {
                $this->updateEmailStatus($email, 'bounced', $reason, $messageId, [
                    'provider' => 'ses',
                    'bounce_type' => $bounceType,
                    'bounce_subtype' => $bounceSubType,
                ]);
            }
        }
    }
    
    private function handleSesDelivery(Request $request): void {
        $data = $request->all();
        
        if (isset($data['Message'])) {
            $data = json_decode($data['Message'], true) ?? $data;
        }
        
        $delivery = $data['delivery'] ?? null;
        if (!$delivery) return;
        
        $recipients = $delivery['recipients'] ?? [];
        $messageId = $data['mail']['messageId'] ?? null;
        
        foreach ($recipients as $email) {
            $this->updateEmailStatus($email, 'sent', null, $messageId, [
                'provider' => 'ses',
                'event_type' => 'delivered',
            ]);
        }
    }
    
    /**
     * Postmark Event Webhook Handler
     */
    private function handlePostmarkBounce(Request $request): void {
        $data = $request->all();
        
        $email = $data['Email'] ?? $data['Recipient'] ?? null;
        $reason = $data['Description'] ?? $data['Details'] ?? 'Postmark bounce';
        $messageId = $data['MessageID'] ?? null;
        $bounceType = $data['Type'] ?? 'HardBounce';
        
        if ($email) {
            $this->updateEmailStatus($email, 'bounced', $reason, $messageId, [
                'provider' => 'postmark',
                'bounce_type' => $bounceType,
            ]);
        }
    }
    
    private function handlePostmarkDelivery(Request $request): void {
        $data = $request->all();
        
        $email = $data['Recipient'] ?? null;
        $messageId = $data['MessageID'] ?? null;
        
        if ($email && ($data['RecordType'] ?? '') === 'Delivery') {
            $this->updateEmailStatus($email, 'sent', null, $messageId, [
                'provider' => 'postmark',
                'event_type' => 'delivered',
            ]);
        }
    }
    
    /**
     * Generic bounce handler for custom/unknown providers
     */
    private function handleGenericBounce(Request $request): void {
        $data = $request->all();
        
        // Try common field names
        $email = $data['email'] ?? $data['recipient'] ?? $data['to'] ?? 
                 $data['Email'] ?? $data['Recipient'] ?? null;
        $reason = $data['reason'] ?? $data['error'] ?? $data['message'] ?? 
                  $data['Reason'] ?? $data['Error'] ?? 'Email bounced';
        $messageId = $data['message_id'] ?? $data['messageId'] ?? $data['MessageId'] ?? null;
        
        if ($email) {
            $this->updateEmailStatus($email, 'bounced', $reason, $messageId, [
                'provider' => 'generic',
                'raw_data' => json_encode($data),
            ]);
        }
    }
    
    private function handleGenericDelivery(Request $request): void {
        $data = $request->all();
        
        $email = $data['email'] ?? $data['recipient'] ?? $data['to'] ?? null;
        $messageId = $data['message_id'] ?? $data['messageId'] ?? null;
        
        if ($email) {
            $this->updateEmailStatus($email, 'sent', null, $messageId, [
                'provider' => 'generic',
            ]);
        }
    }
    
    // ==================== Helper Methods ====================
    
    /**
     * Update email log status based on recipient email
     */
    private function updateEmailStatus(
        string $recipientEmail, 
        string $status, 
        ?string $errorMessage = null,
        ?string $externalMessageId = null,
        array $metadata = []
    ): void {
        $db = Database::getConnection();
        
        // Find the most recent email log for this recipient
        $stmt = $db->prepare("
            SELECT id, status 
            FROM email_logs 
            WHERE recipient_email = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$recipientEmail]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$log) {
            error_log("Webhook: No email log found for recipient: $recipientEmail");
            return;
        }
        
        // Update the log
        $stmt = $db->prepare("
            UPDATE email_logs 
            SET status = ?, 
                error_message = COALESCE(?, error_message),
                bounce_type = ?,
                bounced_at = CASE WHEN ? = 'bounced' THEN NOW() ELSE bounced_at END,
                webhook_data = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $bounceType = $metadata['bounce_type'] ?? ($status === 'bounced' ? 'hard' : null);
        
        $stmt->execute([
            $status,
            $errorMessage,
            $bounceType,
            $status,
            json_encode($metadata),
            $log['id']
        ]);
        
        error_log("Webhook: Updated email log #{$log['id']} to status: $status");
        
        // If bounced, optionally notify admins
        if ($status === 'bounced') {
            $this->notifyAdminOfBounce($recipientEmail, $errorMessage);
        }
    }
    
    /**
     * Mark email as spam complaint
     */
    private function markEmailAsComplaint(string $email, array $data): void {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            UPDATE email_logs 
            SET status = 'failed', 
                error_message = 'Marked as spam by recipient',
                is_complaint = TRUE,
                webhook_data = ?,
                updated_at = NOW()
            WHERE recipient_email = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([json_encode($data), $email]);
    }
    
    /**
     * Detect email provider from request headers/payload
     */
    private function detectProvider(Request $request): string {
        $headers = getallheaders();
        $data = $request->all();
        
        // Check headers
        if (isset($headers['X-Mailgun-Signature']) || isset($headers['X-Mailgun-Variables'])) {
            return 'mailgun';
        }
        
        if (isset($headers['X-Twilio-Email-Event-Webhook-Signature'])) {
            return 'sendgrid';
        }
        
        // Check payload structure
        if (isset($data['sg_message_id']) || isset($data[0]['sg_message_id'])) {
            return 'sendgrid';
        }
        
        if (isset($data['event-data']) || isset($data['signature']['token'])) {
            return 'mailgun';
        }
        
        if (isset($data['notificationType']) && in_array($data['notificationType'], ['Bounce', 'Delivery', 'Complaint'])) {
            return 'ses';
        }
        
        if (isset($data['RecordType']) || isset($data['MessageID'])) {
            return 'postmark';
        }
        
        return 'generic';
    }
    
    /**
     * Verify webhook signature
     */
    private function verifySignature(Request $request): bool {
        $headers = getallheaders();
        
        // SendGrid signature verification
        if (isset($headers['X-Twilio-Email-Event-Webhook-Signature'])) {
            // Implement SendGrid signature verification if needed
            return true; // Skip for now
        }
        
        // Mailgun signature verification
        if (isset($headers['X-Mailgun-Signature'])) {
            $data = $request->all();
            $signature = $data['signature'] ?? [];
            
            if (isset($signature['timestamp'], $signature['token'], $signature['signature'])) {
                $expectedSignature = hash_hmac(
                    'sha256',
                    $signature['timestamp'] . $signature['token'],
                    $this->webhookSecret
                );
                return hash_equals($expectedSignature, $signature['signature']);
            }
        }
        
        // Generic token verification
        $providedToken = $headers['X-Webhook-Token'] ?? $headers['Authorization'] ?? null;
        if ($providedToken) {
            return hash_equals($this->webhookSecret, str_replace('Bearer ', '', $providedToken));
        }
        
        return true; // Allow if no signature mechanism detected
    }
    
    /**
     * Log incoming webhook for debugging
     */
    private function logWebhook(string $type, array $data): void {
        $db = Database::getConnection();
        
        try {
            $stmt = $db->prepare("
                INSERT INTO webhook_logs (type, payload, ip_address, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([
                $type,
                json_encode($data),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        } catch (\Exception $e) {
            // Table might not exist yet, just log to error_log
            error_log("Webhook received ($type): " . json_encode($data));
        }
    }
    
    /**
     * Notify admin of email bounce
     */
    private function notifyAdminOfBounce(string $email, ?string $reason): void {
        // Get admin email from env
        $adminEmail = $_ENV['ADMIN_NOTIFICATION_EMAIL'] ?? 'info@ieosuia.com';
        
        $subject = "[IEOSUIA Alert] Email Bounce Detected";
        $body = "
            <h2>Email Bounce Alert</h2>
            <p><strong>Bounced Email:</strong> {$email}</p>
            <p><strong>Reason:</strong> " . ($reason ?? 'Unknown') . "</p>
            <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
            <p>Please check the admin dashboard for more details.</p>
        ";
        
        try {
            Mailer::send($adminEmail, $subject, $body);
        } catch (\Exception $e) {
            error_log("Failed to send bounce notification: " . $e->getMessage());
        }
    }
}
