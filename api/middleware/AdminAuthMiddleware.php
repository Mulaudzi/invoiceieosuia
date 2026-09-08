<?php

class AdminAuthMiddleware {
    public function handle(): bool {
        return AdminController::verifyAdminToken();
    }
}
