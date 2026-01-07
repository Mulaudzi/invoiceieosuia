<?php

class Product extends Model {
    protected static string $table = 'products';
    protected static array $fillable = [
        'user_id', 'name', 'description', 'price',
        'tax_rate', 'category', 'unit', 'status'
    ];
    
    public function getCategories(int $userId): array {
        $stmt = $this->db->prepare(
            "SELECT DISTINCT category FROM " . static::$table . 
            " WHERE user_id = ? AND category IS NOT NULL AND category != ''"
        );
        $stmt->execute([$userId]);
        return array_column($stmt->fetchAll(), 'category');
    }
}
