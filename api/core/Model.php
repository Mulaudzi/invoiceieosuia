<?php

abstract class Model {
    protected static string $table;
    protected static array $fillable = [];
    protected PDO $db;
    
    public function __construct() {
        $this->db = Database::getConnection();
    }
    
    public static function query(): static {
        return new static();
    }
    
    public function all(): array {
        $stmt = $this->db->query("SELECT * FROM " . static::$table);
        return $stmt->fetchAll();
    }
    
    public function find(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM " . static::$table . " WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    public function where(string $column, $value): static {
        $this->conditions[] = [$column, '=', $value];
        return $this;
    }
    
    public function whereIn(string $column, array $values): static {
        $this->inConditions[] = [$column, $values];
        return $this;
    }
    
    protected array $conditions = [];
    protected array $inConditions = [];
    protected ?string $orderBy = null;
    protected ?string $orderDir = 'ASC';
    protected ?int $limitCount = null;
    
    public function orderBy(string $column, string $dir = 'ASC'): static {
        $this->orderBy = $column;
        $this->orderDir = $dir;
        return $this;
    }
    
    public function limit(int $count): static {
        $this->limitCount = $count;
        return $this;
    }
    
    public function get(): array {
        $sql = "SELECT * FROM " . static::$table;
        $params = [];
        
        if (!empty($this->conditions) || !empty($this->inConditions)) {
            $sql .= " WHERE ";
            $clauses = [];
            
            foreach ($this->conditions as $cond) {
                $clauses[] = "{$cond[0]} {$cond[1]} ?";
                $params[] = $cond[2];
            }
            
            foreach ($this->inConditions as $cond) {
                $placeholders = implode(',', array_fill(0, count($cond[1]), '?'));
                $clauses[] = "{$cond[0]} IN ($placeholders)";
                $params = array_merge($params, $cond[1]);
            }
            
            $sql .= implode(' AND ', $clauses);
        }
        
        if ($this->orderBy) {
            $sql .= " ORDER BY {$this->orderBy} {$this->orderDir}";
        }
        
        if ($this->limitCount) {
            $sql .= " LIMIT {$this->limitCount}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        // Reset conditions
        $this->conditions = [];
        $this->inConditions = [];
        $this->orderBy = null;
        $this->limitCount = null;
        
        return $stmt->fetchAll();
    }
    
    public function first(): ?array {
        $this->limitCount = 1;
        $result = $this->get();
        return $result[0] ?? null;
    }
    
    public function create(array $data): int {
        $filtered = array_intersect_key($data, array_flip(static::$fillable));
        $columns = implode(', ', array_keys($filtered));
        $placeholders = implode(', ', array_fill(0, count($filtered), '?'));
        
        $sql = "INSERT INTO " . static::$table . " ($columns) VALUES ($placeholders)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($filtered));
        
        return (int) $this->db->lastInsertId();
    }
    
    public function update(int $id, array $data): bool {
        $filtered = array_intersect_key($data, array_flip(static::$fillable));
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($filtered)));
        
        $sql = "UPDATE " . static::$table . " SET $sets WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([...array_values($filtered), $id]);
    }
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM " . static::$table . " WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function count(): int {
        $sql = "SELECT COUNT(*) as count FROM " . static::$table;
        $params = [];
        
        if (!empty($this->conditions)) {
            $sql .= " WHERE ";
            $clauses = [];
            
            foreach ($this->conditions as $cond) {
                $clauses[] = "{$cond[0]} {$cond[1]} ?";
                $params[] = $cond[2];
            }
            
            $sql .= implode(' AND ', $clauses);
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        $this->conditions = [];
        return (int) $result['count'];
    }
    
    public function sum(string $column): float {
        $sql = "SELECT SUM($column) as total FROM " . static::$table;
        $params = [];
        
        if (!empty($this->conditions)) {
            $sql .= " WHERE ";
            $clauses = [];
            
            foreach ($this->conditions as $cond) {
                $clauses[] = "{$cond[0]} {$cond[1]} ?";
                $params[] = $cond[2];
            }
            
            $sql .= implode(' AND ', $clauses);
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        
        $this->conditions = [];
        return (float) ($result['total'] ?? 0);
    }
}
