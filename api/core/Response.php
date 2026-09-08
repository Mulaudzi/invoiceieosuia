<?php

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    public static function error(string $message, int $status = 400, array $details = []): void {
        self::json(array_merge(['error' => $message, 'message' => $message], $details), $status);
    }
    
    public static function success($data = null, int $status = 200): void {
        self::json($data ?? ['success' => true], $status);
    }
}
