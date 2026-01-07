<?php

class Request {
    private array $data;
    private array $query;
    
    public function __construct() {
        $this->query = $_GET;
        
        $input = file_get_contents('php://input');
        $this->data = json_decode($input, true) ?? [];
    }
    
    public function input(string $key, $default = null) {
        return $this->data[$key] ?? $default;
    }
    
    public function all(): array {
        return $this->data;
    }
    
    public function query(string $key, $default = null) {
        return $this->query[$key] ?? $default;
    }
    
    public function has(string $key): bool {
        return isset($this->data[$key]);
    }
    
    public function validate(array $rules): array {
        $errors = [];
        $validated = [];
        
        foreach ($rules as $field => $rule) {
            $value = $this->input($field);
            $ruleList = explode('|', $rule);
            
            foreach ($ruleList as $r) {
                if ($r === 'required' && empty($value) && $value !== '0' && $value !== 0) {
                    $errors[$field] = "$field is required";
                    break;
                }
                
                if ($r === 'email' && $value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field] = "$field must be a valid email";
                    break;
                }
                
                if ($r === 'numeric' && $value && !is_numeric($value)) {
                    $errors[$field] = "$field must be numeric";
                    break;
                }
                
                if (preg_match('/^min:(\d+)$/', $r, $matches)) {
                    $min = (int) $matches[1];
                    if (strlen($value) < $min) {
                        $errors[$field] = "$field must be at least $min characters";
                        break;
                    }
                }
                
                if (preg_match('/^max:(\d+)$/', $r, $matches)) {
                    $max = (int) $matches[1];
                    if (strlen($value) > $max) {
                        $errors[$field] = "$field must not exceed $max characters";
                        break;
                    }
                }
            }
            
            if (!isset($errors[$field]) && ($value !== null || strpos($rule, 'required') !== false)) {
                $validated[$field] = $value;
            }
        }
        
        if (!empty($errors)) {
            Response::json(['errors' => $errors], 422);
        }
        
        return $validated;
    }
    
    public function bearerToken(): ?string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
