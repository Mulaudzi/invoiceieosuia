<?php

class Template extends Model {
    protected static string $table = 'templates';
    protected static array $fillable = [
        'user_id', 'name', 'description', 'is_default', 'styles'
    ];
    
    public static function getDefaultStyles(): array {
        return [
            'primaryColor' => '#1e3a5f',
            'accentColor' => '#f59e0b',
            'fontFamily' => 'Inter',
            'headerStyle' => 'left',
            'showLogo' => true,
            'showBorder' => true,
            'showWatermark' => false,
            'tableStyle' => 'striped',
        ];
    }
    
    public function findWithParsedStyles(int $id): ?array {
        $template = $this->find($id);
        if ($template && isset($template['styles'])) {
            $template['styles'] = json_decode($template['styles'], true);
        }
        return $template;
    }
    
    public function createWithStyles(array $data): int {
        if (isset($data['styles']) && is_array($data['styles'])) {
            $data['styles'] = json_encode($data['styles']);
        }
        return $this->create($data);
    }
    
    public function updateWithStyles(int $id, array $data): bool {
        if (isset($data['styles']) && is_array($data['styles'])) {
            $data['styles'] = json_encode($data['styles']);
        }
        return $this->update($id, $data);
    }
    
    public function unsetDefaultsForUser(int $userId): void {
        $stmt = $this->db->prepare(
            "UPDATE " . static::$table . " SET is_default = 0 WHERE user_id = ?"
        );
        $stmt->execute([$userId]);
    }
}
