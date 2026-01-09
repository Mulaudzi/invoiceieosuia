<?php

class AuthController {
    public function register(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|min:8',
        ]);
        
        $user = User::query();
        
        // Check if email exists
        if ($user->findByEmail($data['email'])) {
            Response::error('Email already registered', 422);
        }
        
        // Create user
        $userId = $user->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
            'plan' => $request->input('plan', 'free'),
            'business_name' => $request->input('business_name'),
            'status' => 'active'
        ]);
        
        $newUser = $user->find($userId);
        unset($newUser['password']);
        
        // Generate verification token and send email
        $this->createAndSendVerificationEmail($userId, $newUser['email'], $newUser['name']);
        
        $token = Auth::generateToken($userId);
        
        Response::json([
            'user' => $newUser,
            'token' => $token
        ], 201);
    }
    
    public function login(): void {
        $request = new Request();
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        $user = User::query()->findByEmail($data['email']);
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Invalid credentials', 401);
        }
        
        if ($user['status'] !== 'active') {
            Response::error('Account is inactive', 403);
        }
        
        unset($user['password']);
        $token = Auth::generateToken($user['id']);
        
        Response::json([
            'user' => $user,
            'token' => $token
        ]);
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
        
        Response::json($user);
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
        
        if (!$token) {
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
        
        if ($user['email_verified_at']) {
            Response::error('Email is already verified', 422);
        }
        
        // Rate limit: 3 attempts per 15 minutes
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
}
