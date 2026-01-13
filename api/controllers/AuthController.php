<?php

class AuthController {
    public function register(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|min:8',
        ]);
        
        // Verify reCAPTCHA (if enabled)
        $recaptchaToken = $request->input('recaptcha_token');
        if (Recaptcha::isEnabled()) {
            $recaptchaResult = Recaptcha::verify($recaptchaToken ?? '', 'register');
            if (!$recaptchaResult['success']) {
                Response::error($recaptchaResult['error'], 422);
            }
        }
        
        // Rate limit signup: 3 attempts per hour per IP
        $rateLimiter = new RateLimitMiddleware(3, 60);
        if (!$rateLimiter->handle('signup:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'))) {
            return;
        }
        
        // Comprehensive email validation (disposable, role-based, MX check)
        $emailValidation = EmailValidator::validate($data['email']);
        if (!$emailValidation['valid']) {
            Response::error($emailValidation['error'], 422);
        }
        
        $user = User::query();
        
        // Check if email exists
        if ($user->findByEmail($data['email'])) {
            Response::error('Email already registered', 422);
        }
        
        // Password strength validation
        $passwordCheck = $this->validatePasswordStrength($data['password']);
        if (!$passwordCheck['valid']) {
            Response::error($passwordCheck['error'], 422);
        }
        
        $rateLimiter->hit();
        
        // Create user with Argon2ID (more secure than bcrypt)
        $userId = $user->create([
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'password' => password_hash($data['password'], PASSWORD_ARGON2ID),
            'plan' => $request->input('plan', 'free'),
            'business_name' => $request->input('business_name'),
            'status' => 'active'
        ]);
        
        $newUser = $user->find($userId);
        unset($newUser['password']);
        
        // Generate verification token and send email
        $this->createAndSendVerificationEmail($userId, $newUser['email'], $newUser['name']);
        
        $token = Auth::generateToken($userId);
        
        // Log successful registration
        error_log("New user registered: {$newUser['email']} (ID: $userId)");
        
        Response::json([
            'user' => Auth::formatUserForFrontend($newUser),
            'token' => $token
        ], 201);
    }
    
    /**
     * Get admin user from database by email
     */
    private function getAdminUser(string $email): ?array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM admin_users WHERE email = ? AND status = 'active'");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Check if email belongs to an admin user
     */
    private function isAdminEmail(string $email): bool {
        return $this->getAdminUser($email) !== null;
    }
    
    public function login(): void {
        $request = new Request();
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        // Verify reCAPTCHA (if enabled)
        $recaptchaToken = $request->input('recaptcha_token');
        if (Recaptcha::isEnabled()) {
            $recaptchaResult = Recaptcha::verify($recaptchaToken ?? '', 'login');
            if (!$recaptchaResult['success']) {
                Response::error($recaptchaResult['error'], 422);
            }
        }
        
        $email = strtolower(trim($data['email']));
        
        // Check if this is an admin login attempt
        if ($this->isAdminEmail($email)) {
            $this->handleAdminLogin($email, $data['password']);
            return;
        }
        
        // Rate limit login: 5 attempts per 15 minutes per email
        $rateLimiter = new RateLimitMiddleware(5, 15);
        if (!$rateLimiter->handle('login:' . $email)) {
            return;
        }
        
        $user = User::query()->findByEmail($email);
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            $rateLimiter->hit();
            // Log failed attempt
            error_log("Failed login attempt for: $email from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
            Response::error('Invalid credentials', 401);
        }
        
        if ($user['status'] !== 'active') {
            Response::error('Account is inactive', 403);
        }
        
        // Clear rate limit on successful login
        $rateLimiter->clear();
        
        unset($user['password']);
        $token = Auth::generateToken($user['id']);
        
        // Log successful login
        error_log("Successful login: {$user['email']} (ID: {$user['id']})");
        
        Response::json([
            'user' => Auth::formatUserForFrontend($user),
            'token' => $token
        ]);
    }
    
    /**
     * Handle multi-step admin login from the regular login page
     */
    private function handleAdminLogin(string $email, string $password): void {
        $request = new Request();
        $step = (int) $request->input('admin_step', 1);
        $sessionToken = $request->input('admin_session_token');
        
        // Rate limit admin login attempts
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $rateLimiter = new RateLimitMiddleware(5, 15);
        if (!$rateLimiter->handle('admin_login:' . $ip)) {
            // Send alert for rate limit exceeded
            $this->sendAdminLoginAlert($step, $ip, 'Rate limit exceeded');
            return;
        }
        
        $db = Database::getConnection();
        
        // Get admin user from database
        $adminUser = $this->getAdminUser($email);
        if (!$adminUser) {
            Response::error('Invalid credentials', 401);
            return;
        }
        
        // Clean up expired sessions (including inactive sessions older than 5 minutes)
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE expires_at < NOW()");
        $stmt->execute();
        
        // Also clean up sessions with step < 99 that haven't been updated in 2 minutes (inactivity timeout)
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE step < 99 AND last_activity < DATE_SUB(NOW(), INTERVAL 2 MINUTE)");
        $stmt->execute();
        
        // Step 1: First password
        if ($step === 1) {
            if (!password_verify($password, $adminUser['password_1'])) {
                $rateLimiter->hit();
                error_log("Admin login step 1 failed from IP: $ip");
                AdminActivityLogger::logAuth('admin_login_failed', 'failed', null, $email, ['step' => 1, 'reason' => 'Wrong first password']);
                $this->sendAdminLoginAlert(1, $ip, 'Wrong first password');
                Response::error('Invalid credentials', 401);
                return;
            }
            
            // Create session for step 2 with 2-minute timeout
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+5 minutes'));
            
            $stmt = $db->prepare("
                INSERT INTO admin_sessions (session_token, ip_address, step, expires_at, last_activity, admin_user_id) 
                VALUES (?, ?, 2, ?, NOW(), ?)
            ");
            $stmt->execute([hash('sha256', $token), $ip, $expiresAt, $adminUser['id']]);
            
            Response::json([
                'admin_login' => true,
                'step' => 2,
                'session_token' => $token,
                'message' => 'Enter second password',
                'timeout' => 120 // 2 minutes in seconds
            ]);
            return;
        }
        
        // Steps 2 & 3: Validate session token
        if (!$sessionToken) {
            Response::error('Session expired. Please start over.', 401);
            return;
        }
        
        // Check session with inactivity timeout (2 minutes)
        $stmt = $db->prepare("
            SELECT * FROM admin_sessions 
            WHERE session_token = ? AND ip_address = ? AND step = ? 
            AND expires_at > NOW() 
            AND last_activity > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
        ");
        $stmt->execute([hash('sha256', $sessionToken), $ip, $step]);
        $session = $stmt->fetch();
        
        if (!$session) {
            // Check if session exists but timed out due to inactivity
            $stmt = $db->prepare("SELECT * FROM admin_sessions WHERE session_token = ?");
            $stmt->execute([hash('sha256', $sessionToken)]);
            $expiredSession = $stmt->fetch();
            
            if ($expiredSession) {
                // Delete the expired session
                $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token = ?");
                $stmt->execute([hash('sha256', $sessionToken)]);
                Response::error('Session timed out due to inactivity. Please start over.', 401);
            } else {
                Response::error('Session expired. Please start over.', 401);
            }
            return;
        }
        
        // Update last activity timestamp
        $stmt = $db->prepare("UPDATE admin_sessions SET last_activity = NOW() WHERE session_token = ?");
        $stmt->execute([hash('sha256', $sessionToken)]);
        
        // Validate password for current step using database hashes
        $passwordField = 'password_' . $step;
        if (!password_verify($password, $adminUser[$passwordField])) {
            $rateLimiter->hit();
            error_log("Admin login step $step failed from IP: $ip");
            
            // Log failed attempt
            AdminActivityLogger::logAuth('admin_login_failed', 'failed', null, $email, ['step' => $step, 'reason' => "Wrong password at step $step"]);
            
            // Send security alert
            $this->sendAdminLoginAlert($step, $ip, "Wrong password at step $step");
            
            // Delete session on failure
            $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token = ?");
            $stmt->execute([hash('sha256', $sessionToken)]);
            
            Response::error('Invalid credentials', 401);
            return;
        }
        
        // Step 2: Update session for step 3
        if ($step === 2) {
            $stmt = $db->prepare("UPDATE admin_sessions SET step = 3, last_activity = NOW() WHERE session_token = ?");
            $stmt->execute([hash('sha256', $sessionToken)]);
            
            Response::json([
                'admin_login' => true,
                'step' => 3,
                'session_token' => $sessionToken,
                'message' => 'Enter third password',
                'timeout' => 120 // 2 minutes in seconds
            ]);
            return;
        }
        
        // Step 3: All passwords correct - generate admin token
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE session_token = ?");
        $stmt->execute([hash('sha256', $sessionToken)]);
        
        $adminToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $db->prepare("
            INSERT INTO admin_sessions (session_token, ip_address, step, expires_at, last_activity, admin_user_id) 
            VALUES (?, ?, 99, ?, NOW(), ?)
        ");
        $stmt->execute([hash('sha256', $adminToken), $ip, $expiresAt, $adminUser['id']]);
        
        // Update last login
        $stmt = $db->prepare("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?");
        $stmt->execute([$adminUser['id']]);
        
        // Log successful login
        AdminActivityLogger::logAuth('admin_login_success', 'success', $adminUser['id'], $adminUser['email'], [
            'step' => 3,
            'message' => 'All 3 password steps completed'
        ]);
        
        error_log("Admin login successful for {$adminUser['email']} from IP: $ip");
        
        Response::json([
            'admin_login' => true,
            'success' => true,
            'admin_token' => $adminToken,
            'admin_name' => $adminUser['name'],
            'message' => 'Admin login successful'
        ]);
    }
    
    /**
     * Send email alert for failed admin login attempts
     */
    private function sendAdminLoginAlert(int $step, string $ip, string $reason): void {
        try {
            // Count recent attempts from this IP
            $db = Database::getConnection();
            $stmt = $db->prepare("
                SELECT COUNT(*) as count FROM admin_sessions 
                WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            $stmt->execute([$ip]);
            $result = $stmt->fetch();
            $attemptCount = ($result['count'] ?? 0) + 1;
            
            // Send email alert
            Mailer::sendAdminSecurityAlert($step, $ip, $attemptCount);
            
            error_log("Admin security alert sent: $reason from IP: $ip (attempt #$attemptCount)");
        } catch (Exception $e) {
            error_log("Failed to send admin security alert: " . $e->getMessage());
        }
    }
    
    public function logout(): void {
        $request = new Request();
        $token = $request->bearerToken();
        
        if ($token) {
            Auth::revokeToken($token);
        }
        
        Response::success(['message' => 'Logged out']);
    }
    
    public function user(): void {
        Response::json(Auth::user());
    }
    
    public function updateProfile(): void {
        $request = new Request();
        $data = $request->all();
        
        $allowed = ['name', 'business_name', 'phone', 'address', 'tax_number'];
        $filtered = array_intersect_key($data, array_flip($allowed));
        
        User::query()->update(Auth::id(), $filtered);
        
        $user = User::query()->find(Auth::id());
        unset($user['password']);
        
        Response::json(Auth::formatUserForFrontend($user));
    }
    
    public function updatePassword(): void {
        $request = new Request();
        $data = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8',
        ]);
        
        $user = User::query()->find(Auth::id());
        
        if (!password_verify($data['current_password'], $user['password'])) {
            Response::error('Current password is incorrect', 422);
        }
        
        User::query()->update(Auth::id(), [
            'password' => password_hash($data['new_password'], PASSWORD_DEFAULT)
        ]);
        
        Response::success(['message' => 'Password updated successfully']);
    }
    
    public function uploadAvatar(): void {
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No file uploaded or upload error', 422);
        }
        
        $file = $_FILES['avatar'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        // Validate file type
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, $allowedTypes)) {
            Response::error('Invalid file type. Allowed: JPG, PNG, GIF, WEBP', 422);
        }
        
        // Max file size: 5MB
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error('File too large. Maximum size: 5MB', 422);
        }
        
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = match($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'jpg'
        };
        $filename = Auth::id() . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        // Delete old avatar if exists
        $user = User::query()->find(Auth::id());
        if (!empty($user['avatar'])) {
            $oldPath = $uploadDir . basename($user['avatar']);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            Response::error('Failed to save file', 500);
        }
        
        // Update user avatar URL
        $avatarUrl = '/api/uploads/avatars/' . $filename;
        User::query()->update(Auth::id(), ['avatar' => $avatarUrl]);
        
        $updatedUser = User::query()->find(Auth::id());
        unset($updatedUser['password']);
        
        Response::json([
            'message' => 'Avatar uploaded successfully',
            'avatar' => $avatarUrl,
            'user' => $updatedUser
        ]);
    }
    
    public function deleteAvatar(): void {
        $user = User::query()->find(Auth::id());
        
        if (!empty($user['avatar'])) {
            $uploadDir = __DIR__ . '/../uploads/avatars/';
            $oldPath = $uploadDir . basename($user['avatar']);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }
        
        User::query()->update(Auth::id(), ['avatar' => null]);
        
        $updatedUser = User::query()->find(Auth::id());
        unset($updatedUser['password']);
        
        Response::json([
            'message' => 'Avatar deleted successfully',
            'user' => $updatedUser
        ]);
    }

    public function updatePlan(): void {
        $request = new Request();
        $plan = $request->input('plan');
        
        if (!in_array($plan, ['free', 'pro', 'business'])) {
            Response::error('Invalid plan', 422);
        }
        
        User::query()->update(Auth::id(), ['plan' => $plan]);
        
        $user = User::query()->find(Auth::id());
        unset($user['password']);
        
        Response::json($user);
    }
    
    public function verifyEmail(): void {
        $request = new Request();
        $token = $request->input('token');
        
        // Also check query parameter as fallback (for direct link clicks)
        if (!$token) {
            $token = $request->query('token');
        }
        
        if (!$token) {
            error_log("verifyEmail: No token received. Body: " . json_encode($request->all()) . " Query: " . json_encode($_GET));
            Response::error('Verification token is required', 422);
        }
        
        $db = Database::getConnection();
        $hash = hash('sha256', $token);
        
        // Find valid token
        $stmt = $db->prepare("
            SELECT user_id FROM email_verifications 
            WHERE token = ? AND expires_at > NOW()
        ");
        $stmt->execute([$hash]);
        $result = $stmt->fetch();
        
        if (!$result) {
            Response::error('Invalid or expired verification token', 422);
        }
        
        // Mark email as verified
        $stmt = $db->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?");
        $stmt->execute([$result['user_id']]);
        
        // Delete used token
        $stmt = $db->prepare("DELETE FROM email_verifications WHERE user_id = ?");
        $stmt->execute([$result['user_id']]);
        
        // Send welcome email
        $user = User::query()->find($result['user_id']);
        if ($user) {
            Mailer::sendWelcomeEmail($user['email'], $user['name']);
        }
        
        Response::success(['message' => 'Email verified successfully']);
    }
    
    public function resendVerification(): void {
        $user = Auth::user();
        
        // Check using camelCase key from formatUserForFrontend
        if ($user['emailVerified']) {
            Response::error('Email is already verified', 422);
        }
        
        // Rate limit: 3 attempts per 15 minutes per user
        $rateLimiter = new RateLimitMiddleware(3, 15);
        if (!$rateLimiter->handle('resend_verification:' . $user['id'])) {
            return;
        }
        $rateLimiter->hit();
        
        $this->createAndSendVerificationEmail($user['id'], $user['email'], $user['name']);
        
        Response::success(['message' => 'Verification email sent']);
    }
    
    public function forgotPassword(): void {
        $request = new Request();
        $email = $request->input('email');
        
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Valid email is required', 422);
        }
        
        // Rate limit: 5 attempts per 60 minutes
        $rateLimiter = new RateLimitMiddleware(5, 60);
        if (!$rateLimiter->handle('forgot_password:' . $email)) {
            return;
        }
        $rateLimiter->hit();
        
        $user = User::query()->findByEmail($email);
        
        // Always return success to prevent email enumeration
        if (!$user) {
            Response::success(['message' => 'If an account exists with that email, a password reset link has been sent.']);
            return;
        }
        
        // Delete any existing reset tokens for this email
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$email]);
        
        // Create new reset token
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $hash, $expiresAt]);
        
        // Send reset email
        Mailer::sendPasswordResetEmail($email, $user['name'], $token);
        
        Response::success(['message' => 'If an account exists with that email, a password reset link has been sent.']);
    }
    
    public function resetPassword(): void {
        $request = new Request();
        $data = $request->validate([
            'token' => 'required',
            'password' => 'required|min:8',
        ]);
        
        $db = Database::getConnection();
        $hash = hash('sha256', $data['token']);
        
        // Find valid token
        $stmt = $db->prepare("
            SELECT email FROM password_resets 
            WHERE token = ? AND expires_at > NOW()
        ");
        $stmt->execute([$hash]);
        $result = $stmt->fetch();
        
        if (!$result) {
            Response::error('Invalid or expired reset token', 422);
        }
        
        // Update password
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->execute([password_hash($data['password'], PASSWORD_DEFAULT), $result['email']]);
        
        // Delete all reset tokens for this email
        $stmt = $db->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$result['email']]);
        
        // Revoke all existing tokens for security
        $user = User::query()->findByEmail($result['email']);
        if ($user) {
            $stmt = $db->prepare("DELETE FROM api_tokens WHERE user_id = ?");
            $stmt->execute([$user['id']]);
        }
        
        Response::success(['message' => 'Password reset successfully']);
    }
    
    private function createAndSendVerificationEmail(int $userId, string $email, string $name): void {
        $db = Database::getConnection();
        
        // Delete existing verification tokens
        $stmt = $db->prepare("DELETE FROM email_verifications WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Create new token
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $db->prepare("INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $hash, $expiresAt]);
        
        // Send email
        Mailer::sendVerificationEmail($email, $name, $token);
    }
    
    /**
     * Validate password strength
     * Requirements: min 8 chars, mixed case, numbers, special chars
     */
    private function validatePasswordStrength(string $password): array {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'at least 8 characters';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'a lowercase letter';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'an uppercase letter';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'a number';
        }
        
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
            $errors[] = 'a special character';
        }
        
        if (empty($errors)) {
            return ['valid' => true, 'error' => null];
        }
        
        return [
            'valid' => false,
            'error' => 'Password must contain ' . implode(', ', $errors)
        ];
    }
    
    public function uploadLogo(): void {
        if (!isset($_FILES['logo'])) {
            Response::error('No logo file uploaded', 422);
        }
        
        $file = $_FILES['logo'];
        
        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('File upload failed', 422);
        }
        
        // Check file size (max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            Response::error('Logo must be smaller than 2MB', 422);
        }
        
        // Check mime type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        $mimeType = mime_content_type($file['tmp_name']);
        if (!in_array($mimeType, $allowedTypes)) {
            Response::error('Invalid file type. Allowed: PNG, JPG, GIF, WEBP, SVG', 422);
        }
        
        // Create uploads directory if not exists
        $uploadDir = __DIR__ . '/../uploads/logos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = match($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
            default => 'png'
        };
        $filename = Auth::id() . '_logo_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        
        // Delete old logo if exists
        $user = User::query()->find(Auth::id());
        if (!empty($user['logo_path'])) {
            $oldPath = $uploadDir . basename($user['logo_path']);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            Response::error('Failed to save file', 500);
        }
        
        // Update user logo URL
        $logoUrl = '/api/uploads/logos/' . $filename;
        User::query()->update(Auth::id(), ['logo_path' => $logoUrl]);
        
        $updatedUser = User::query()->find(Auth::id());
        unset($updatedUser['password']);
        
        Response::json([
            'message' => 'Logo uploaded successfully',
            'logo_path' => $logoUrl,
            'user' => $this->formatUserForFrontend($updatedUser)
        ]);
    }
    
    public function deleteLogo(): void {
        $user = User::query()->find(Auth::id());
        
        if (!empty($user['logo_path'])) {
            $uploadDir = __DIR__ . '/../uploads/logos/';
            $oldPath = $uploadDir . basename($user['logo_path']);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }
        
        User::query()->update(Auth::id(), ['logo_path' => null]);
        
        $updatedUser = User::query()->find(Auth::id());
        unset($updatedUser['password']);
        
        Response::json([
            'message' => 'Logo deleted successfully',
            'user' => $this->formatUserForFrontend($updatedUser)
        ]);
    }
    
    /**
     * Create a new admin user (temporary setup endpoint)
     * This should be disabled or protected after initial setup
     */
    public function createAdmin(): void {
        $request = new Request();
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'required|max:255',
            'password_1' => 'required|min:6',
            'password_2' => 'required|min:6',
            'password_3' => 'required|min:6',
            'setup_key' => 'required',
        ]);
        
        // Validate setup key (temporary security measure)
        $setupKey = getenv('ADMIN_SETUP_KEY') ?: 'ieosuia_admin_setup_2025';
        if ($data['setup_key'] !== $setupKey) {
            Response::error('Invalid setup key', 403);
            return;
        }
        
        $db = Database::getConnection();
        
        // Check if email already exists
        $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ?");
        $stmt->execute([strtolower(trim($data['email']))]);
        if ($stmt->fetch()) {
            Response::error('Admin with this email already exists', 422);
            return;
        }
        
        // Hash passwords using Argon2ID (same as regular users)
        $hashedPassword1 = password_hash($data['password_1'], PASSWORD_ARGON2ID);
        $hashedPassword2 = password_hash($data['password_2'], PASSWORD_ARGON2ID);
        $hashedPassword3 = password_hash($data['password_3'], PASSWORD_ARGON2ID);
        
        // Insert admin user
        $stmt = $db->prepare("
            INSERT INTO admin_users (email, name, password_1, password_2, password_3, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        ");
        $stmt->execute([
            strtolower(trim($data['email'])),
            $data['name'],
            $hashedPassword1,
            $hashedPassword2,
            $hashedPassword3
        ]);
        
        $adminId = $db->lastInsertId();
        
        // Log admin creation
        AdminActivityLogger::logUserManagement('admin_user_created', (int)$adminId, [
            'email' => strtolower(trim($data['email'])),
            'name' => $data['name']
        ], 'success');
        
        error_log("New admin user created: {$data['email']} (ID: $adminId)");
        
        Response::json([
            'success' => true,
            'message' => 'Admin user created successfully',
            'admin_id' => $adminId
        ], 201);
    }
    
    /**
     * Get list of admin users (for admin management)
     */
    public function getAdminUsers(): void {
        $db = Database::getConnection();
        
        $stmt = $db->prepare("
            SELECT id, email, name, status, last_login_at, created_at 
            FROM admin_users 
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json(['data' => $admins]);
    }
    
    /**
     * Update admin user details
     */
    public function updateAdminUser(array $params): void {
        $id = $params['id'] ?? null;
        if (!$id) {
            Response::error('Admin ID required', 400);
            return;
        }
        
        $request = new Request();
        $db = Database::getConnection();
        
        // Check if admin exists
        $stmt = $db->prepare("SELECT * FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin) {
            Response::error('Admin user not found', 404);
            return;
        }
        
        $updates = [];
        $params_arr = [];
        
        // Update name if provided
        $name = $request->input('name');
        if ($name) {
            $updates[] = "name = ?";
            $params_arr[] = $name;
        }
        
        // Update email if provided
        $email = $request->input('email');
        if ($email) {
            // Check if email is already taken by another admin
            $stmt = $db->prepare("SELECT id FROM admin_users WHERE email = ? AND id != ?");
            $stmt->execute([strtolower(trim($email)), $id]);
            if ($stmt->fetch()) {
                Response::error('Email already in use by another admin', 422);
                return;
            }
            $updates[] = "email = ?";
            $params_arr[] = strtolower(trim($email));
        }
        
        // Update status if provided
        $status = $request->input('status');
        if ($status && in_array($status, ['active', 'inactive'])) {
            $updates[] = "status = ?";
            $params_arr[] = $status;
        }
        
        // Update passwords if provided (all three must be provided together)
        $password_1 = $request->input('password_1');
        $password_2 = $request->input('password_2');
        $password_3 = $request->input('password_3');
        
        if ($password_1 && $password_2 && $password_3) {
            $updates[] = "password_1 = ?";
            $params_arr[] = password_hash($password_1, PASSWORD_ARGON2ID);
            $updates[] = "password_2 = ?";
            $params_arr[] = password_hash($password_2, PASSWORD_ARGON2ID);
            $updates[] = "password_3 = ?";
            $params_arr[] = password_hash($password_3, PASSWORD_ARGON2ID);
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
            return;
        }
        
        $params_arr[] = $id;
        $sql = "UPDATE admin_users SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params_arr);
        
        // Log the update
        $changedFields = [];
        if ($name) $changedFields[] = 'name';
        if ($email) $changedFields[] = 'email';
        if ($status) $changedFields[] = 'status';
        if ($password_1 && $password_2 && $password_3) $changedFields[] = 'passwords';
        
        AdminActivityLogger::logUserManagement('admin_user_updated', (int)$id, [
            'target_email' => $admin['email'],
            'changed_fields' => implode(', ', $changedFields)
        ]);
        
        error_log("Admin user updated: ID $id");
        
        Response::json([
            'success' => true,
            'message' => 'Admin user updated successfully'
        ]);
    }
    
    /**
     * Toggle admin user status (activate/deactivate)
     */
    public function toggleAdminStatus(array $params): void {
        $id = $params['id'] ?? null;
        if (!$id) {
            Response::error('Admin ID required', 400);
            return;
        }
        
        $db = Database::getConnection();
        
        // Get current status
        $stmt = $db->prepare("SELECT status FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin) {
            Response::error('Admin user not found', 404);
            return;
        }
        
        $newStatus = $admin['status'] === 'active' ? 'inactive' : 'active';
        
        $stmt = $db->prepare("UPDATE admin_users SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $id]);
        
        // Log status change
        AdminActivityLogger::logUserManagement(
            $newStatus === 'active' ? 'admin_user_activated' : 'admin_user_deactivated',
            (int)$id,
            ['previous_status' => $admin['status'], 'new_status' => $newStatus]
        );
        
        error_log("Admin user status changed: ID $id -> $newStatus");
        
        Response::json([
            'success' => true,
            'message' => "Admin user " . ($newStatus === 'active' ? 'activated' : 'deactivated'),
            'status' => $newStatus
        ]);
    }
    
    /**
     * Delete admin user
     */
    public function deleteAdminUser(array $params): void {
        $id = $params['id'] ?? null;
        if (!$id) {
            Response::error('Admin ID required', 400);
            return;
        }
        
        $db = Database::getConnection();
        
        // Check if admin exists
        $stmt = $db->prepare("SELECT id FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Admin user not found', 404);
            return;
        }
        
        // Count remaining active admins
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM admin_users WHERE status = 'active' AND id != ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] < 1) {
            Response::error('Cannot delete the last active admin user', 400);
            return;
        }
        
        // Get admin email before deletion for logging
        $stmt = $db->prepare("SELECT email FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        $adminToDelete = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $db->prepare("DELETE FROM admin_users WHERE id = ?");
        $stmt->execute([$id]);
        
        // Log deletion
        AdminActivityLogger::logUserManagement('admin_user_deleted', (int)$id, [
            'deleted_email' => $adminToDelete['email'] ?? 'unknown'
        ]);
        
        error_log("Admin user deleted: ID $id");
        
        Response::json([
            'success' => true,
            'message' => 'Admin user deleted successfully'
        ]);
    }
}
