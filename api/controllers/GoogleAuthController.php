<?php

class GoogleAuthController {
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;
    
    public function __construct() {
        $this->clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
        $this->clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
        $this->redirectUri = ($_ENV['APP_URL'] ?? 'https://invoices.ieosuia.com') . '/auth/google/callback';
    }
    
    /**
     * Get Google OAuth URL
     */
    public function getAuthUrl(): void {
        if (empty($this->clientId)) {
            Response::error('Google OAuth is not configured', 500);
        }
        
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => bin2hex(random_bytes(16))
        ];
        
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
        
        Response::json(['url' => $authUrl]);
    }
    
    /**
     * Handle Google OAuth callback
     */
    public function callback(): void {
        $request = new Request();
        $code = $request->input('code');
        
        if (!$code) {
            Response::error('Authorization code is required', 422);
            return;
        }
        
        if (empty($this->clientId) || empty($this->clientSecret)) {
            error_log("Google OAuth not configured. Client ID: " . (empty($this->clientId) ? 'MISSING' : 'SET') . 
                      ", Client Secret: " . (empty($this->clientSecret) ? 'MISSING' : 'SET'));
            Response::error('Google OAuth is not configured. Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.', 500);
            return;
        }
        
        // Exchange code for tokens
        $tokenResponse = $this->exchangeCodeForToken($code);
        
        if (!$tokenResponse) {
            Response::error('Failed to exchange authorization code. The code may have expired.', 400);
            return;
        }
        
        if (!isset($tokenResponse['access_token'])) {
            $errorMsg = $tokenResponse['error_description'] ?? $tokenResponse['error'] ?? 'Unknown error';
            error_log("Google token exchange error: " . json_encode($tokenResponse));
            Response::error("Google authentication failed: $errorMsg", 400);
            return;
        }
        
        // Get user info from Google
        $googleUser = $this->getGoogleUser($tokenResponse['access_token']);
        
        if (!$googleUser || !isset($googleUser['email'])) {
            error_log("Failed to get Google user info: " . json_encode($googleUser));
            Response::error('Failed to get user information from Google', 400);
            return;
        }
        
        // Find or create user
        $user = $this->findOrCreateUser($googleUser);
        
        // Generate API token
        $token = Auth::generateToken($user['id']);
        
        // Log successful login
        error_log("Google OAuth login: {$user['email']} (ID: {$user['id']})");
        
        Response::json([
            'user' => Auth::formatUserForFrontend($user),
            'token' => $token
        ]);
    }
    
    /**
     * Exchange authorization code for access token
     */
    private function exchangeCodeForToken(string $code): ?array {
        $ch = curl_init('https://oauth2.googleapis.com/token');
        
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'code' => $code,
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'redirect_uri' => $this->redirectUri,
                'grant_type' => 'authorization_code'
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Google token exchange failed: $response");
            return null;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Get user info from Google
     */
    private function getGoogleUser(string $accessToken): ?array {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer $accessToken"]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Google user info failed: $response");
            return null;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Find existing user or create new one
     */
    private function findOrCreateUser(array $googleUser): array {
        $db = Database::getConnection();
        $email = strtolower(trim($googleUser['email']));
        
        // Check if user exists
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Update Google ID if not set
            if (empty($user['google_id'])) {
                $stmt = $db->prepare("UPDATE users SET google_id = ?, avatar = COALESCE(avatar, ?) WHERE id = ?");
                $stmt->execute([$googleUser['id'], $googleUser['picture'] ?? null, $user['id']]);
            }
            
            // Mark email as verified if it comes from Google
            if (empty($user['email_verified_at'])) {
                $stmt = $db->prepare("UPDATE users SET email_verified_at = NOW() WHERE id = ?");
                $stmt->execute([$user['id']]);
            }
            
            unset($user['password']);
            return $user;
        }
        
        // Create new user
        $stmt = $db->prepare("
            INSERT INTO users (name, email, google_id, avatar, plan, status, email_verified_at, created_at)
            VALUES (?, ?, ?, ?, 'free', 'active', NOW(), NOW())
        ");
        $stmt->execute([
            $googleUser['name'] ?? $googleUser['email'],
            $email,
            $googleUser['id'],
            $googleUser['picture'] ?? null
        ]);
        
        $userId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $newUser = $stmt->fetch();
        
        // Send welcome email
        Mailer::sendWelcomeEmail($email, $newUser['name']);
        
        error_log("New Google OAuth user: $email (ID: $userId)");
        
        unset($newUser['password']);
        return $newUser;
    }
}
