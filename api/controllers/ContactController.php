<?php

require_once __DIR__ . '/../core/Mailer.php';

class ContactController {
    
    // Email routing based on purpose
    private static array $emailRouting = [
        'general' => 'hello@ieosuia.com',
        'support' => 'support@ieosuia.com',
        'sales' => 'sales@ieosuia.com',
    ];
    
    // CC email for all messages
    private const CC_EMAIL = 'info@ieosuia.com';
    
    // Purpose labels for email subject
    private static array $purposeLabels = [
        'general' => 'General Inquiry',
        'support' => 'Support Request',
        'sales' => 'Sales Inquiry',
    ];
    
    public function submit(): void {
        $request = new Request();
        $data = $request->all();
        
        // Rate limit: 5 submissions per 15 minutes per IP
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $rateLimiter = new RateLimitMiddleware(5, 15);
        if (!$rateLimiter->handle('contact:' . $ip)) {
            return;
        }
        
        // Verify reCAPTCHA (if enabled)
        $recaptchaToken = $request->input('recaptcha_token');
        if (Recaptcha::isEnabled()) {
            $recaptchaResult = Recaptcha::verify($recaptchaToken ?? '', 'contact');
            if (!$recaptchaResult['success']) {
                Response::error($recaptchaResult['error'], 422);
                return;
            }
        }
        
        // Validate required fields
        $errors = $this->validate($data);
        if (!empty($errors)) {
            Response::error('Validation failed', 400, ['errors' => $errors]);
            return;
        }
        
        $rateLimiter->hit();
        
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $message = trim($data['message'] ?? '');
        $purpose = trim($data['purpose'] ?? 'general');
        $origin = trim($data['origin'] ?? 'Unknown');
        
        // Sanitize purpose
        if (!array_key_exists($purpose, self::$emailRouting)) {
            $purpose = 'general';
        }
        
        // Save submission to database
        $submissionId = $this->saveSubmission($name, $email, $message, $purpose, $origin, $ip);
        
        // Get recipient based on purpose
        $recipientEmail = self::$emailRouting[$purpose];
        $purposeLabel = self::$purposeLabels[$purpose];
        
        // Generate email subject
        $subject = "[IEOSUIA Contact] {$purposeLabel} from {$name}";
        
        // Generate email body
        $body = $this->getContactEmailTemplate([
            'name' => htmlspecialchars($name),
            'email' => htmlspecialchars($email),
            'purpose' => $purposeLabel,
            'message' => nl2br(htmlspecialchars($message)),
            'origin' => htmlspecialchars($origin),
            'timestamp' => date('Y-m-d H:i:s T'),
            'submission_id' => $submissionId,
        ]);
        
        // Plain text version
        $altBody = "New Contact Form Submission (ID: #$submissionId)\n\n";
        $altBody .= "From: {$name} <{$email}>\n";
        $altBody .= "Purpose: {$purposeLabel}\n";
        $altBody .= "Origin: {$origin}\n";
        $altBody .= "Date: " . date('Y-m-d H:i:s T') . "\n\n";
        $altBody .= "Message:\n{$message}";
        
        // Send the notification email
        $notificationSent = $this->sendContactEmail(
            $recipientEmail,
            $subject,
            $body,
            $altBody,
            $email,
            $name,
            $submissionId
        );
        
        // Send confirmation email to user
        $confirmationSent = $this->sendConfirmationEmail($email, $name, $purposeLabel, $submissionId);
        
        if ($notificationSent) {
            Response::json([
                'success' => true,
                'message' => 'Your message has been sent successfully.',
                'recipient' => $recipientEmail,
            ]);
        } else {
            // Still save submission even if email fails
            Response::json([
                'success' => true,
                'message' => 'Your message has been received. Our team will contact you soon.',
                'warning' => 'Email delivery is pending.',
            ]);
        }
    }
    
    private function saveSubmission(
        string $name, 
        string $email, 
        string $message, 
        string $purpose, 
        string $origin,
        string $ip
    ): int {
        $db = Database::getConnection();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        $stmt = $db->prepare("
            INSERT INTO contact_submissions 
            (name, email, message, purpose, origin, ip_address, user_agent, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
        ");
        $stmt->execute([$name, $email, $message, $purpose, $origin, $ip, $userAgent]);
        
        return (int)$db->lastInsertId();
    }
    
    private function logEmail(
        int $submissionId,
        string $recipientEmail,
        string $subject,
        string $emailType,
        string $status,
        ?string $errorMessage = null,
        ?string $ccEmails = null
    ): int {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            INSERT INTO email_logs 
            (contact_submission_id, recipient_email, cc_emails, subject, email_type, status, error_message, sent_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $sentAt = $status === 'sent' ? date('Y-m-d H:i:s') : null;
        $stmt->execute([
            $submissionId, 
            $recipientEmail, 
            $ccEmails, 
            $subject, 
            $emailType, 
            $status, 
            $errorMessage,
            $sentAt
        ]);
        
        return (int)$db->lastInsertId();
    }
    
    private function updateEmailLog(int $logId, string $status, ?string $errorMessage = null): void {
        $db = Database::getConnection();
        $sentAt = $status === 'sent' ? date('Y-m-d H:i:s') : null;
        
        $stmt = $db->prepare("
            UPDATE email_logs 
            SET status = ?, error_message = ?, sent_at = COALESCE(?, sent_at) 
            WHERE id = ?
        ");
        $stmt->execute([$status, $errorMessage, $sentAt, $logId]);
    }
    
    private function validate(array $data): array {
        $errors = [];
        
        // Name validation
        $name = trim($data['name'] ?? '');
        if (empty($name)) {
            $errors['name'] = 'Name is required';
        } elseif (strlen($name) > 100) {
            $errors['name'] = 'Name must be less than 100 characters';
        }
        
        // Email validation
        $email = trim($data['email'] ?? '');
        if (empty($email)) {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email address';
        } elseif (strlen($email) > 255) {
            $errors['email'] = 'Email must be less than 255 characters';
        }
        
        // Message validation
        $message = trim($data['message'] ?? '');
        if (empty($message)) {
            $errors['message'] = 'Message is required';
        } elseif (strlen($message) > 5000) {
            $errors['message'] = 'Message must be less than 5000 characters';
        }
        
        // Purpose validation
        $purpose = trim($data['purpose'] ?? '');
        if (!empty($purpose) && !array_key_exists($purpose, self::$emailRouting)) {
            $errors['purpose'] = 'Invalid inquiry type';
        }
        
        return $errors;
    }
    
    private function sendContactEmail(
        string $to, 
        string $subject, 
        string $body, 
        string $altBody,
        string $replyTo,
        string $replyToName,
        int $submissionId
    ): bool {
        // Log email as pending
        $logId = $this->logEmail(
            $submissionId,
            $to,
            $subject,
            'contact_notification',
            'pending',
            null,
            self::CC_EMAIL
        );
        
        try {
            // Use PHPMailer directly for more control
            require_once __DIR__ . '/../lib/PHPMailer/Exception.php';
            require_once __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
            require_once __DIR__ . '/../lib/PHPMailer/SMTP.php';
            
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            
            // SMTP Configuration
            $mail->isSMTP();
            $mail->Host = $_ENV['MAIL_HOST'] ?? 'smtp.mailtrap.io';
            $mail->SMTPAuth = true;
            $mail->Username = $_ENV['MAIL_USERNAME'] ?? '';
            $mail->Password = $_ENV['MAIL_PASSWORD'] ?? '';
            
            $encryption = strtolower($_ENV['MAIL_ENCRYPTION'] ?? 'tls');
            if ($encryption === 'ssl') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls') {
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            }
            
            $mail->Port = (int)($_ENV['MAIL_PORT'] ?? 587);
            
            // Sender
            $fromAddress = trim($_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@ieosuia.com', '"\'');
            $fromName = 'IEOSUIA Contact Form';
            $mail->setFrom($fromAddress, $fromName);
            
            // Reply-To (the person who submitted the form)
            $mail->addReplyTo($replyTo, $replyToName);
            
            // Recipients
            $mail->addAddress($to);
            
            // CC info@ieosuia.com on all messages
            $mail->addCC(self::CC_EMAIL);
            
            // Content
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->AltBody = $altBody;
            
            $sent = $mail->send();
            
            // Update log
            $this->updateEmailLog($logId, 'sent');
            
            return true;
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            error_log("Contact Email Error: " . $errorMessage);
            
            // Update log with error
            $this->updateEmailLog($logId, 'failed', $errorMessage);
            
            return false;
        }
    }
    
    private function sendConfirmationEmail(string $email, string $name, string $purposeLabel, int $submissionId): bool {
        $subject = "We've received your message - IEOSUIA";
        
        // Log email as pending
        $logId = $this->logEmail(
            $submissionId,
            $email,
            $subject,
            'contact_confirmation',
            'pending'
        );
        
        $body = $this->getConfirmationEmailTemplate([
            'name' => htmlspecialchars($name),
            'purpose' => $purposeLabel,
            'submission_id' => $submissionId,
        ]);
        
        try {
            $sent = Mailer::send($email, $subject, $body);
            
            if ($sent) {
                $this->updateEmailLog($logId, 'sent');
            } else {
                $this->updateEmailLog($logId, 'failed', 'Mailer returned false');
            }
            
            return $sent;
        } catch (\Exception $e) {
            $this->updateEmailLog($logId, 'failed', $e->getMessage());
            return false;
        }
    }
    
    private function getContactEmailTemplate(array $data): string {
        return '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a5f, #0d1f33); padding: 30px; text-align: center; }
                    .header h1 { color: #fff; margin: 0; font-size: 24px; }
                    .content { padding: 30px; }
                    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .info-label { font-weight: bold; width: 100px; color: #666; }
                    .info-value { flex: 1; }
                    .message-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    .badge { display: inline-block; background: #10b981; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                    .id-badge { display: inline-block; background: #1e3a5f; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📬 New Contact Form Submission <span class="id-badge">#' . ($data['submission_id'] ?? '') . '</span></h1>
                    </div>
                    <div class="content">
                        <p><span class="badge">' . $data['purpose'] . '</span></p>
                        
                        <div style="margin: 20px 0;">
                            <div class="info-row">
                                <span class="info-label">From:</span>
                                <span class="info-value">' . $data['name'] . '</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value"><a href="mailto:' . $data['email'] . '">' . $data['email'] . '</a></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Origin:</span>
                                <span class="info-value">' . $data['origin'] . '</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date:</span>
                                <span class="info-value">' . $data['timestamp'] . '</span>
                            </div>
                        </div>
                        
                        <h3>Message:</h3>
                        <div class="message-box">
                            ' . $data['message'] . '
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            <strong>Reply directly to this email</strong> to respond to the sender.
                        </p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the IEOSUIA website contact form.</p>
                        <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ';
    }
    
    private function getConfirmationEmailTemplate(array $data): string {
        return '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a5f, #0d1f33); padding: 30px; text-align: center; }
                    .header h1 { color: #fff; margin: 0; font-size: 24px; }
                    .content { padding: 30px; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
                    .ref-number { background: #f0f0f0; padding: 8px 16px; border-radius: 4px; font-family: monospace; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>IEOSUIA</h1>
                    </div>
                    <div class="content">
                        <p class="success-icon">✅</p>
                        <h2 style="text-align: center;">Message Received!</h2>
                        <p>Hi ' . $data['name'] . ',</p>
                        <p>Thank you for contacting us! We\'ve received your <strong>' . $data['purpose'] . '</strong> and our team will review it shortly.</p>
                        <p style="text-align: center;">Reference: <span class="ref-number">#' . $data['submission_id'] . '</span></p>
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our team will review your message</li>
                            <li>We aim to respond within 24 hours on business days</li>
                            <li>For urgent matters, you can reach us on WhatsApp: +27 63 808 2493</li>
                        </ul>
                        <p>Thank you for choosing IEOSUIA!</p>
                        <p>Best regards,<br>The IEOSUIA Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                        <p>26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095</p>
                    </div>
                </div>
            </body>
            </html>
        ';
    }
}