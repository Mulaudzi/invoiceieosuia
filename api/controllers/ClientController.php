<?php

class ClientController {
    public function index(): void {
        $request = new Request();
        $query = Client::query()->where('user_id', Auth::id());
        
        // Apply search filter
        $search = $request->query('search');
        // Note: For simplicity, we'll fetch all and filter in PHP
        // In production, you'd want to add SQL LIKE support to the Model
        
        $status = $request->query('status');
        if ($status) {
            $query->where('status', $status);
        }
        
        $clients = $query->orderBy('name', 'ASC')->get();
        
        // Apply search filter in PHP
        if ($search) {
            $search = strtolower($search);
            $clients = array_filter($clients, function($c) use ($search) {
                return str_contains(strtolower($c['name']), $search) ||
                       str_contains(strtolower($c['email'] ?? ''), $search) ||
                       str_contains(strtolower($c['company'] ?? ''), $search);
            });
            $clients = array_values($clients);
        }
        
        // Add stats to each client
        $clientModel = new Client();
        $clients = array_map(fn($c) => $clientModel->withStats($c), $clients);
        
        Response::json($clients);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|max:255',
        ]);
        
        $data = array_merge($request->all(), ['user_id' => Auth::id()]);
        
        $id = Client::query()->create($data);
        $client = Client::query()->find($id);
        
        $clientModel = new Client();
        Response::json($clientModel->withStats($client), 201);
    }
    
    public function show(array $params): void {
        $client = Client::query()->find((int) $params['id']);
        
        if (!$client || $client['user_id'] !== Auth::id()) {
            Response::error('Client not found', 404);
        }
        
        $clientModel = new Client();
        Response::json($clientModel->withStats($client));
    }
    
    public function update(array $params): void {
        $client = Client::query()->find((int) $params['id']);
        
        if (!$client || $client['user_id'] !== Auth::id()) {
            Response::error('Client not found', 404);
        }
        
        $request = new Request();
        Client::query()->update($client['id'], $request->all());
        
        $updated = Client::query()->find($client['id']);
        $clientModel = new Client();
        Response::json($clientModel->withStats($updated));
    }
    
    public function destroy(array $params): void {
        $client = Client::query()->find((int) $params['id']);
        
        if (!$client || $client['user_id'] !== Auth::id()) {
            Response::error('Client not found', 404);
        }
        
        Client::query()->delete($client['id']);
        Response::success();
    }
}
