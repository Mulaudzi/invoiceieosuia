<?php

// Include PHPMailer (manually in lib/)
require_once __DIR__ . '/../lib/PHPMailer/Exception.php';
require_once __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../lib/PHPMailer/SMTP.php';

// Note: PHPMailer files have namespaces defined, so we use them directly
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    private static ?PHPMailer $mailer = null;
    
    private static function getInstance(): PHPMailer {
        if (self::$mailer === null) {
            self::$mailer = new PHPMailer(true);
            
            // SMTP Configuration
            self::$mailer->isSMTP();
            self::$mailer->Host = $_ENV['MAIL_HOST'] ?? 'smtp.mailtrap.io';
            self::$mailer->SMTPAuth = true;
            self::$mailer->Username = $_ENV['MAIL_USERNAME'] ?? '';
            self::$mailer->Password = $_ENV['MAIL_PASSWORD'] ?? '';
            
            // Handle encryption - convert string to PHPMailer constant
            $encryption = strtolower($_ENV['MAIL_ENCRYPTION'] ?? 'tls');
            if ($encryption === 'ssl') {
                self::$mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls') {
                self::$mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                self::$mailer->SMTPSecure = false; // No encryption
            }
            
            self::$mailer->Port = (int)($_ENV['MAIL_PORT'] ?? 587);
            
            // Enable debug output to error_log for troubleshooting
            self::$mailer->SMTPDebug = SMTP::DEBUG_OFF; // Set to SMTP::DEBUG_SERVER to debug
            self::$mailer->Debugoutput = function($str, $level) {
                error_log("PHPMailer [$level]: $str");
            };
            
            // Default sender - strip quotes from env values
            $fromAddress = trim($_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@ieosuia.com', '"\'');
            $fromName = str_replace('${APP_NAME}', $_ENV['APP_NAME'] ?? 'IEOSUIA', $_ENV['MAIL_FROM_NAME'] ?? 'IEOSUIA');
            $fromName = trim($fromName, '"\'');
            
            self::$mailer->setFrom($fromAddress, $fromName);
            
            self::$mailer->isHTML(true);
            self::$mailer->CharSet = 'UTF-8';
        }
        
        return self::$mailer;
    }
    
    public static function send(string $to, string $subject, string $body, string $altBody = ''): bool {
        try {
            $mail = self::getInstance();
            $mail->clearAddresses();
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = $body;
            $mail->AltBody = $altBody ?: strip_tags($body);
            
            return $mail->send();
        } catch (Exception $e) {
            error_log("Mailer Error: " . $e->getMessage());
            return false;
        }
    }
    
    public static function sendVerificationEmail(string $email, string $name, string $token): bool {
        $verifyUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/verify-email?token={$token}";
        
        $subject = "Verify Your Email - IEOSUIA";
        $body = self::getEmailTemplate('verification', [
            'name' => htmlspecialchars($name),
            'verify_url' => $verifyUrl,
            'token' => $token,
        ]);
        
        return self::send($email, $subject, $body);
    }
    
    public static function sendPasswordResetEmail(string $email, string $name, string $token): bool {
        $resetUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/reset-password?token={$token}";
        
        $subject = "Reset Your Password - IEOSUIA";
        $body = self::getEmailTemplate('password_reset', [
            'name' => htmlspecialchars($name),
            'reset_url' => $resetUrl,
            'expires' => '60 minutes',
        ]);
        
        return self::send($email, $subject, $body);
    }
    
    public static function sendWelcomeEmail(string $email, string $name): bool {
        $loginUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/login";
        $dashboardUrl = ($_ENV['APP_URL'] ?? 'http://localhost:5173') . "/dashboard";
        
        $subject = "Welcome to IEOSUIA!";
        $body = self::getEmailTemplate('welcome', [
            'name' => htmlspecialchars($name),
            'login_url' => $loginUrl,
            'dashboard_url' => $dashboardUrl,
        ]);
        
        return self::send($email, $subject, $body);
    }
    
    private static function getEmailTemplate(string $template, array $data): string {
        $templates = [
            'verification' => '
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
                        .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                        .button:hover { background: #059669; }
                        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .code { background: #f0f0f0; padding: 10px 20px; font-family: monospace; font-size: 18px; border-radius: 4px; letter-spacing: 2px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>IEOSUIA</h1>
                        </div>
                        <div class="content">
                            <h2>Verify Your Email</h2>
                            <p>Hi {{name}},</p>
                            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                            <p style="text-align: center;">
                                <a href="{{verify_url}}" class="button">Verify Email</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #666; font-size: 14px;">{{verify_url}}</p>
                            <p>This link will expire in 24 hours.</p>
                            <p>If you did not create an account, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ',
            'password_reset' => '
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
                        .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                        .button:hover { background: #059669; }
                        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>IEOSUIA</h1>
                        </div>
                        <div class="content">
                            <h2>Reset Your Password</h2>
                            <p>Hi {{name}},</p>
                            <p>We received a request to reset your password. Click the button below to set a new password:</p>
                            <p style="text-align: center;">
                                <a href="{{reset_url}}" class="button">Reset Password</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; color: #666; font-size: 14px;">{{reset_url}}</p>
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> This link will expire in {{expires}}. If you did not request a password reset, please ignore this email and your password will remain unchanged.
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ',
            'welcome' => '
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
                        .button { display: inline-block; background: #10b981; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                        .button:hover { background: #059669; }
                        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                        .feature-list { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .feature-list li { margin: 10px 0; }
                        .emoji { font-size: 48px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to IEOSUIA!</h1>
                        </div>
                        <div class="content">
                            <p class="emoji" style="text-align: center;">✅</p>
                            <h2 style="text-align: center;">Your Email is Verified!</h2>
                            <p>Hi {{name}},</p>
                            <p>Congratulations! Your email has been successfully verified and your account is now fully activated.</p>
                            <p>You now have access to all the features of IEOSUIA:</p>
                            <div class="feature-list">
                                <ul>
                                    <li>📄 Create professional invoices in seconds</li>
                                    <li>👥 Manage your clients and products</li>
                                    <li>📊 Track payments and generate reports</li>
                                    <li>📱 Send invoices via email or SMS</li>
                                    <li>🎨 Customize your invoice templates</li>
                                </ul>
                            </div>
                            <p style="text-align: center;">
                                <a href="{{dashboard_url}}" class="button">Go to Dashboard</a>
                            </p>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                            <p>Happy invoicing!<br>The IEOSUIA Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ',
            'admin_security_alert' => '
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; text-align: center; }
                        .header h1 { color: #fff; margin: 0; font-size: 24px; }
                        .content { padding: 30px; }
                        .alert-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
                        .info-table td:first-child { font-weight: bold; width: 40%; color: #666; }
                        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚨 Security Alert</h1>
                        </div>
                        <div class="content">
                            <div class="alert-box">
                                <h2 style="margin-top: 0; color: #dc2626;">Failed Admin Login Attempt</h2>
                                <p>Someone attempted to log into the admin panel with incorrect credentials.</p>
                            </div>
                            <table class="info-table">
                                <tr><td>Step Failed:</td><td>{{step}}</td></tr>
                                <tr><td>IP Address:</td><td>{{ip_address}}</td></tr>
                                <tr><td>User Agent:</td><td>{{user_agent}}</td></tr>
                                <tr><td>Date/Time:</td><td>{{timestamp}}</td></tr>
                                <tr><td>Attempts from IP:</td><td>{{attempt_count}}</td></tr>
                            </table>
                            <p style="color: #666; font-size: 14px;">If this was not you, please ensure your admin credentials are secure and consider additional security measures.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ' . date('Y') . ' IEOSUIA. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            ',
        ];
        
        $html = $templates[$template] ?? '';
        
        foreach ($data as $key => $value) {
            $html = str_replace('{{' . $key . '}}', $value, $html);
        }
        
        return $html;
    }
    
    public static function sendAdminSecurityAlert(int $step, string $ip, int $attemptCount): bool {
        $adminEmail = $_ENV['ADMIN_ALERT_EMAIL'] ?? 'godtheson@ieosuia.com';
        
        $subject = "🚨 SECURITY ALERT: Failed Admin Login Attempt";
        $body = self::getEmailTemplate('admin_security_alert', [
            'step' => "Step $step of 3",
            'ip_address' => $ip,
            'user_agent' => htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'),
            'timestamp' => date('Y-m-d H:i:s T'),
            'attempt_count' => $attemptCount,
        ]);
        
        return self::send($adminEmail, $subject, $body);
    }
}
