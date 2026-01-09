<?php
/**
 * Database Seeder Script
 * Run this script to seed the database with test data
 * Usage: php seed.php
 */

require_once __DIR__ . '/config/database.php';

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

echo "Starting database seeder...\n";

try {
    $db = Database::getConnection();
    
    // Test user credentials
    $testUser = [
        'name' => 'Test User',
        'email' => 'test@ieosuia.com',
        'password' => password_hash('123456789', PASSWORD_DEFAULT),
        'plan' => 'pro',
        'business_name' => 'IEOSUIA Test Business',
        'phone' => '+1234567890',
        'address' => '123 Test Street, Test City',
        'tax_number' => 'TEST-123456',
        'email_verified_at' => date('Y-m-d H:i:s'),
        'status' => 'active'
    ];
    
    // Check if user already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$testUser['email']]);
    
    if ($stmt->fetch()) {
        // Update existing user
        $stmt = $db->prepare("
            UPDATE users SET 
                name = ?, 
                password = ?, 
                plan = ?, 
                business_name = ?, 
                phone = ?, 
                address = ?, 
                tax_number = ?, 
                email_verified_at = ?, 
                status = ?
            WHERE email = ?
        ");
        $stmt->execute([
            $testUser['name'],
            $testUser['password'],
            $testUser['plan'],
            $testUser['business_name'],
            $testUser['phone'],
            $testUser['address'],
            $testUser['tax_number'],
            $testUser['email_verified_at'],
            $testUser['status'],
            $testUser['email']
        ]);
        echo "✓ Test user updated: {$testUser['email']}\n";
    } else {
        // Insert new user
        $stmt = $db->prepare("
            INSERT INTO users (name, email, password, plan, business_name, phone, address, tax_number, email_verified_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $testUser['name'],
            $testUser['email'],
            $testUser['password'],
            $testUser['plan'],
            $testUser['business_name'],
            $testUser['phone'],
            $testUser['address'],
            $testUser['tax_number'],
            $testUser['email_verified_at'],
            $testUser['status']
        ]);
        echo "✓ Test user created: {$testUser['email']}\n";
    }
    
    echo "\n=== Test User Credentials ===\n";
    echo "Email: test@ieosuia.com\n";
    echo "Password: 123456789\n";
    echo "=============================\n";
    
    echo "\nSeeding completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
