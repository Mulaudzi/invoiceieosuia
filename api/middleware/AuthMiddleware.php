<?php

class AuthMiddleware {
    public function handle(): bool {
        $request = new Request();
        $token = $request->bearerToken();
        
        if (!$token) {
            Response::error('Unauthorized', 401);
            return false;
        }
        
        $user = Auth::validateToken($token);
        
        if (!$user) {
            Response::error('Invalid or expired token', 401);
            return false;
        }
        
        Auth::setUser($user);
        return true;
    }
}
