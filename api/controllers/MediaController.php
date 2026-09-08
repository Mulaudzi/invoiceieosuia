<?php

class MediaController {
    public function show(array $params): void {
        $type = (string) ($params['type'] ?? '');
        $filename = basename((string) ($params['filename'] ?? ''));
        if (!in_array($type, ['avatars', 'logos', 'invoice-logos'], true) || !preg_match('/^[A-Za-z0-9_-]+\.(png|jpe?g)$/i', $filename)) Response::error('Image not found', 404);
        $path = __DIR__ . '/../uploads/' . $type . '/' . $filename;
        if (!is_file($path)) Response::error('Image not found', 404);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        header('Content-Type: ' . ($extension === 'png' ? 'image/png' : 'image/jpeg'));
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=31536000, immutable');
        header('X-Content-Type-Options: nosniff');
        readfile($path);
        exit;
    }
}
