<?php

class ClientGroupController {
    /**
     * List all client groups for the authenticated user
     */
    public function index(): void {
        $query = ClientGroup::query()->where('user_id', Auth::id());
        $groups = $query->orderBy('name', 'ASC')->get();
        
        // Add stats to each group
        $groupModel = new ClientGroup();
        $groups = array_map(fn($g) => $groupModel->withStats($g), $groups);
        
        Response::json($groups);
    }
    
    /**
     * Create a new client group
     */
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
        ]);
        
        $groupData = [
            'user_id' => Auth::id(),
            'name' => $request->input('name'),
            'description' => $request->input('description', ''),
            'color' => $request->input('color', '#6366f1'),
            'status' => $request->input('status', 'active'),
        ];
        
        $id = ClientGroup::query()->create($groupData);
        $group = ClientGroup::query()->find($id);
        
        $groupModel = new ClientGroup();
        Response::json($groupModel->withStats($group), 201);
    }
    
    /**
     * Get a specific client group
     */
    public function show(array $params): void {
        $group = ClientGroup::query()->find((int) $params['id']);
        
        if (!$group || $group['user_id'] !== Auth::id()) {
            Response::error('Client group not found', 404);
        }
        
        $groupModel = new ClientGroup();
        $group = $groupModel->withStats($group);
        
        // Include clients in this group
        $group['clients'] = $groupModel->getClients($group['id']);
        
        Response::json($group);
    }
    
    /**
     * Update a client group
     */
    public function update(array $params): void {
        $group = ClientGroup::query()->find((int) $params['id']);
        
        if (!$group || $group['user_id'] !== Auth::id()) {
            Response::error('Client group not found', 404);
        }
        
        $request = new Request();
        $updateData = array_intersect_key($request->all(), array_flip([
            'name', 'description', 'color', 'status'
        ]));
        
        ClientGroup::query()->update($group['id'], $updateData);
        
        $updated = ClientGroup::query()->find($group['id']);
        $groupModel = new ClientGroup();
        Response::json($groupModel->withStats($updated));
    }
    
    /**
     * Delete a client group
     */
    public function destroy(array $params): void {
        $group = ClientGroup::query()->find((int) $params['id']);
        
        if (!$group || $group['user_id'] !== Auth::id()) {
            Response::error('Client group not found', 404);
        }
        
        // Remove group_id from clients (don't delete clients)
        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE clients SET group_id = NULL WHERE group_id = ?");
        $stmt->execute([$group['id']]);
        
        ClientGroup::query()->delete($group['id']);
        Response::success();
    }
    
    /**
     * Assign clients to a group
     */
    public function assignClients(array $params): void {
        $group = ClientGroup::query()->find((int) $params['id']);
        
        if (!$group || $group['user_id'] !== Auth::id()) {
            Response::error('Client group not found', 404);
        }
        
        $request = new Request();
        $clientIds = $request->input('client_ids', []);
        
        if (!is_array($clientIds)) {
            Response::error('client_ids must be an array', 400);
        }
        
        $db = Database::getConnection();
        
        // Verify all clients belong to this user
        foreach ($clientIds as $clientId) {
            $client = Client::query()->find((int) $clientId);
            if (!$client || $client['user_id'] !== Auth::id()) {
                Response::error('Client not found: ' . $clientId, 404);
            }
        }
        
        // Update clients
        foreach ($clientIds as $clientId) {
            $stmt = $db->prepare("UPDATE clients SET group_id = ? WHERE id = ?");
            $stmt->execute([$group['id'], (int) $clientId]);
        }
        
        $updated = ClientGroup::query()->find($group['id']);
        $groupModel = new ClientGroup();
        $result = $groupModel->withStats($updated);
        $result['clients'] = $groupModel->getClients($group['id']);
        
        Response::json($result);
    }
    
    /**
     * Remove clients from a group
     */
    public function removeClients(array $params): void {
        $group = ClientGroup::query()->find((int) $params['id']);
        
        if (!$group || $group['user_id'] !== Auth::id()) {
            Response::error('Client group not found', 404);
        }
        
        $request = new Request();
        $clientIds = $request->input('client_ids', []);
        
        if (!is_array($clientIds)) {
            Response::error('client_ids must be an array', 400);
        }
        
        $db = Database::getConnection();
        
        foreach ($clientIds as $clientId) {
            $stmt = $db->prepare("UPDATE clients SET group_id = NULL WHERE id = ? AND group_id = ?");
            $stmt->execute([(int) $clientId, $group['id']]);
        }
        
        $updated = ClientGroup::query()->find($group['id']);
        $groupModel = new ClientGroup();
        Response::json($groupModel->withStats($updated));
    }
}
