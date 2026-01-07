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
}
