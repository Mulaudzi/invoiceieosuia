<?php
header('Content-Type: application/json');

$pdo = new PDO(
    'mysql:host=localhost;dbname=ejetffbz_invoices;charset=utf8mb4',
    'ejetffbz_ieosuia',
    'I Am Ieosuia',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$database = 'ejetffbz_invoices';

$tables = $pdo->query("
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = '$database' AND TABLE_TYPE = 'BASE TABLE'
")->fetchAll(PDO::FETCH_COLUMN);

$schema = ['tables' => []];

foreach ($tables as $table) {
    $cols = $pdo->query("
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '$database' AND TABLE_NAME = '$table'
        ORDER BY ORDINAL_POSITION
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    $schema['tables'][$table] = ['columns' => []];
    foreach ($cols as $c) {
        $schema['tables'][$table]['columns'][$c['COLUMN_NAME']] = [
            'type' => $c['COLUMN_TYPE'],
            'nullable' => $c['IS_NULLABLE'] === 'YES',
            'primary' => $c['COLUMN_KEY'] === 'PRI',
            'default' => $c['COLUMN_DEFAULT']
        ];
    }
}

echo json_encode($schema, JSON_PRETTY_PRINT);
