<?php

class CronAuthMiddleware {
    public function handle(): bool {
        $expected = $_ENV['CRON_SECRET'] ?? '';
        $provided = $_SERVER['HTTP_X_CRON_SECRET'] ?? (new Request())->bearerToken() ?? '';

        if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
            Response::error('Unauthorized', 401);
            return false;
        }

        return true;
    }
}
