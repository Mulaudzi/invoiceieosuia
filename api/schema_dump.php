<?php
/**
 * Database Schema Introspection Utility
 * 
 * Outputs a JSON summary of all tables and columns for schema alignment.
 * 
 * USAGE:
 *   - Access via: https://your-api.com/schema_dump.php?key=YOUR_SECRET_KEY
 *   - Or set APP_ENV=local in .env to bypass key check
 * 
 * SECURITY:
 *   - Protected by secret key or local environment check
 *   - Read-only, no schema modifications
 *   - DELETE THIS FILE after use in production
 * 
 * OUTPUT:
 *   - JSON with all tables, columns, types, nullability, primary keys, defaults
 */

// Prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Content-Type: application/json; charset=utf-8');

// Load environment
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Security check
$isLocal = ($_ENV['APP_ENV'] ?? '') === 'local';
$secretKey = $_ENV['SCHEMA_DUMP_KEY'] ?? 'schema_secret_key_change_me';
$providedKey = $_GET['key'] ?? '';

if (!$isLocal && $providedKey !== $secretKey) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Access denied',
        'hint' => 'Provide ?key=YOUR_SECRET_KEY or set APP_ENV=local'
    ], JSON_PRETTY_PRINT);
    exit;
}

// Database connection
try {
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $database = $_ENV['DB_NAME'] ?? '';
    $username = $_ENV['DB_USER'] ?? '';
    $password = $_ENV['DB_PASS'] ?? '';

    if (empty($database)) {
        throw new Exception('DB_NAME not configured in .env');
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
    exit;
}

// Fetch all tables
$tablesQuery = $pdo->prepare("
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
");
$tablesQuery->execute([$database]);
$tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

// Fetch columns for each table
$columnsQuery = $pdo->prepare("
    SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
");

$schema = [
    'database' => $database,
    'generated_at' => date('Y-m-d H:i:s'),
    'table_count' => count($tables),
    'tables' => []
];

foreach ($tables as $tableName) {
    $columnsQuery->execute([$database, $tableName]);
    $columns = $columnsQuery->fetchAll();
    
    $tableSchema = [
        'columns' => []
    ];
    
    foreach ($columns as $col) {
        $tableSchema['columns'][$col['COLUMN_NAME']] = [
            'type' => $col['COLUMN_TYPE'],
            'nullable' => $col['IS_NULLABLE'] === 'YES',
            'primary' => $col['COLUMN_KEY'] === 'PRI',
            'default' => $col['COLUMN_DEFAULT'],
            'extra' => $col['EXTRA'] ?: null
        ];
    }
    
    $schema['tables'][$tableName] = $tableSchema;
}

// Output
echo json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit;
