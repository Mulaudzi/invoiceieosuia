<?php

declare(strict_types=1);

header('Content-Type: application/json');

$environmentFile = dirname(__DIR__, 2) . '/api/.env';
if (!is_file($environmentFile)) {
    throw new RuntimeException('api/.env is required.');
}

foreach (file($environmentFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
        continue;
    }
    [$key, $value] = explode('=', $line, 2);
    $_ENV[trim($key)] = trim(trim($value), "\"'");
}

$required = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];
foreach ($required as $key) {
    if (!isset($_ENV[$key]) || $_ENV[$key] === '') {
        throw new RuntimeException("Missing environment value: {$key}");
    }
}

$database = $_ENV['DB_DATABASE'];
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $_ENV['DB_HOST'], $_ENV['DB_PORT'] ?? '3306', $database),
    $_ENV['DB_USERNAME'],
    $_ENV['DB_PASSWORD'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$tableStatement = $pdo->prepare(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = ?'
);
$tableStatement->execute([$database, 'BASE TABLE']);
$tables = $tableStatement->fetchAll(PDO::FETCH_COLUMN);
$schema = ['tables' => []];

$columnStatement = $pdo->prepare(
    'SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION'
);

foreach ($tables as $table) {
    $columnStatement->execute([$database, $table]);
    $schema['tables'][$table] = ['columns' => []];
    foreach ($columnStatement->fetchAll(PDO::FETCH_ASSOC) as $column) {
        $schema['tables'][$table]['columns'][$column['COLUMN_NAME']] = [
            'type' => $column['COLUMN_TYPE'],
            'nullable' => $column['IS_NULLABLE'] === 'YES',
            'primary' => $column['COLUMN_KEY'] === 'PRI',
            'default' => $column['COLUMN_DEFAULT'],
            'extra' => $column['EXTRA'],
        ];
    }
}

echo json_encode($schema, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
