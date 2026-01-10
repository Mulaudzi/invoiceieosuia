<?php

/**
 * reCAPTCHA v3 Verification
 * Server-side validation for Google reCAPTCHA tokens
 */
class Recaptcha {
    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
    private const MIN_SCORE = 0.5; // Minimum acceptable score (0.0 - 1.0)
    
    /**
     * Verify reCAPTCHA token
     * @param string $token The reCAPTCHA token from frontend
     * @param string $expectedAction The expected action (e.g., 'login', 'register')
     * @return array ['success' => bool, 'score' => float, 'error' => string|null]
     */
    public static function verify(string $token, string $expectedAction = ''): array {
        $secretKey = $_ENV['RECAPTCHA_SECRET_KEY'] ?? '';
        
        // If no secret key configured, skip verification (development mode)
        if (empty($secretKey)) {
            error_log('reCAPTCHA: Secret key not configured, skipping verification');
            return ['success' => true, 'score' => 1.0, 'error' => null];
        }
        
        if (empty($token)) {
            return ['success' => false, 'score' => 0, 'error' => 'reCAPTCHA token is required'];
        }
        
        // Make verification request to Google
        $data = [
            'secret' => $secretKey,
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];
        
        $options = [
            'http' => [
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'method' => 'POST',
                'content' => http_build_query($data),
                'timeout' => 10
            ]
        ];
        
        $context = stream_context_create($options);
        $response = @file_get_contents(self::VERIFY_URL, false, $context);
        
        if ($response === false) {
            error_log('reCAPTCHA: Failed to connect to verification server');
            // Fail open in case of network issues (configurable)
            return ['success' => true, 'score' => 0.5, 'error' => null];
        }
        
        $result = json_decode($response, true);
        
        if (!$result) {
            error_log('reCAPTCHA: Invalid response from verification server');
            return ['success' => false, 'score' => 0, 'error' => 'Verification failed'];
        }
        
        // Log for debugging
        error_log('reCAPTCHA result: ' . json_encode($result));
        
        // Check success
        if (!($result['success'] ?? false)) {
            $errorCodes = $result['error-codes'] ?? [];
            error_log('reCAPTCHA failed: ' . implode(', ', $errorCodes));
            return [
                'success' => false, 
                'score' => 0, 
                'error' => 'Security verification failed. Please try again.'
            ];
        }
        
        // Check action matches (if provided)
        if (!empty($expectedAction) && ($result['action'] ?? '') !== $expectedAction) {
            error_log("reCAPTCHA action mismatch: expected '$expectedAction', got '{$result['action']}'");
            return [
                'success' => false,
                'score' => 0,
                'error' => 'Security verification failed. Please try again.'
            ];
        }
        
        // Check score
        $score = (float)($result['score'] ?? 0);
        if ($score < self::MIN_SCORE) {
            error_log("reCAPTCHA low score: $score (minimum: " . self::MIN_SCORE . ")");
            return [
                'success' => false,
                'score' => $score,
                'error' => 'Security check failed. Please try again or contact support.'
            ];
        }
        
        return [
            'success' => true,
            'score' => $score,
            'error' => null
        ];
    }
    
    /**
     * Check if reCAPTCHA is enabled
     */
    public static function isEnabled(): bool {
        return !empty($_ENV['RECAPTCHA_SECRET_KEY']);
    }
}
