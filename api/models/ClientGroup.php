<?php

class ClientGroup extends Model {
    protected static string $table = 'client_groups';
    protected static array $fillable = [
        'user_id', 'name', 'description', 'color', 'status'
    ];
    
    /**
     * Get all clients in this group
     */
    public function getClients(int $groupId): array {
        return Client::query()
            ->where('group_id', $groupId)
            ->get();
    }
    
    /**
     * Count clients in group
     */
    public function getClientCount(int $groupId): int {
        return Client::query()
            ->where('group_id', $groupId)
            ->count();
    }
    
    /**
     * Add stats to group
     */
    public function withStats(array $group): array {
        $group['client_count'] = $this->getClientCount($group['id']);
        return $group;
    }
}
