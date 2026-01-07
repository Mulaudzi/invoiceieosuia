<?php

class TemplateController {
    public function index(): void {
        $templates = Template::query()
            ->where('user_id', Auth::id())
            ->orderBy('name', 'ASC')
            ->get();
        
        // Parse styles JSON
        $templates = array_map(function($t) {
            if (isset($t['styles'])) {
                $t['styles'] = json_decode($t['styles'], true);
            }
            return $t;
        }, $templates);
        
        Response::json($templates);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
        ]);
        
        $user = Auth::user();
        $templateLimit = match ($user['plan'] ?? 'free') {
            'free' => 3,
            'pro' => 10,
            'business' => 999,
            default => 3,
        };
        
        $count = Template::query()->where('user_id', Auth::id())->count();
        if ($count >= $templateLimit) {
            Response::error("Template limit reached for your plan ($templateLimit)", 403);
        }
        
        $templateModel = new Template();
        
        // Handle default flag
        $isDefault = $request->input('is_default', false);
        if ($isDefault) {
            $templateModel->unsetDefaultsForUser(Auth::id());
        }
        
        // Merge with default styles
        $styles = array_merge(
            Template::getDefaultStyles(),
            $request->input('styles', [])
        );
        
        $id = $templateModel->createWithStyles([
            'user_id' => Auth::id(),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'is_default' => $isDefault ? 1 : 0,
            'styles' => $styles
        ]);
        
        $template = $templateModel->findWithParsedStyles($id);
        Response::json($template, 201);
    }
    
    public function show(array $params): void {
        $templateModel = new Template();
        $template = $templateModel->findWithParsedStyles((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        Response::json($template);
    }
    
    public function update(array $params): void {
        $templateModel = new Template();
        $template = $templateModel->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        $request = new Request();
        
        // Handle default flag
        $isDefault = $request->input('is_default');
        if ($isDefault) {
            $templateModel->unsetDefaultsForUser(Auth::id());
        }
        
        $updateData = [];
        
        if ($request->has('name')) {
            $updateData['name'] = $request->input('name');
        }
        if ($request->has('description')) {
            $updateData['description'] = $request->input('description');
        }
        if ($isDefault !== null) {
            $updateData['is_default'] = $isDefault ? 1 : 0;
        }
        if ($request->has('styles')) {
            $currentStyles = json_decode($template['styles'] ?? '{}', true) ?: [];
            $updateData['styles'] = array_merge($currentStyles, $request->input('styles'));
        }
        
        $templateModel->updateWithStyles($template['id'], $updateData);
        
        $updated = $templateModel->findWithParsedStyles($template['id']);
        Response::json($updated);
    }
    
    public function destroy(array $params): void {
        $templateModel = new Template();
        $template = $templateModel->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        $wasDefault = $template['is_default'];
        
        $templateModel->delete($template['id']);
        
        // Set another template as default if deleted was default
        if ($wasDefault) {
            $remaining = Template::query()
                ->where('user_id', Auth::id())
                ->limit(1)
                ->first();
            
            if ($remaining) {
                $templateModel->update($remaining['id'], ['is_default' => 1]);
            }
        }
        
        Response::success();
    }
    
    public function setDefault(array $params): void {
        $templateModel = new Template();
        $template = $templateModel->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        $templateModel->unsetDefaultsForUser(Auth::id());
        $templateModel->update($template['id'], ['is_default' => 1]);
        
        $updated = $templateModel->findWithParsedStyles($template['id']);
        Response::json($updated);
    }
}
