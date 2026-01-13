<?php

class MessageTemplateController {
    /**
     * List all message templates for the authenticated user
     */
    public function index(): void {
        $request = new Request();
        $type = $request->query('type'); // 'email' or 'sms'
        
        $query = MessageTemplate::query()->where('user_id', Auth::id());
        
        if ($type) {
            $query->where('type', $type);
        }
        
        $templates = $query->orderBy('category', 'ASC')->get();
        
        Response::json($templates);
    }
    
    /**
     * Get email templates
     */
    public function getEmailTemplates(): void {
        $templates = MessageTemplate::query()
            ->where('user_id', Auth::id())
            ->where('type', 'email')
            ->orderBy('category', 'ASC')
            ->get();
        
        // If no templates, return defaults
        if (empty($templates)) {
            $templates = MessageTemplate::getDefaultEmailTemplates();
        }
        
        Response::json($templates);
    }
    
    /**
     * Get SMS templates
     */
    public function getSmsTemplates(): void {
        $templates = MessageTemplate::query()
            ->where('user_id', Auth::id())
            ->where('type', 'sms')
            ->orderBy('category', 'ASC')
            ->get();
        
        // If no templates, return defaults
        if (empty($templates)) {
            $templates = MessageTemplate::getDefaultSmsTemplates();
        }
        
        Response::json($templates);
    }
    
    /**
     * Create or update an email template
     */
    public function saveEmailTemplate(): void {
        $user = Auth::user();
        
        // Check if user has paid plan
        if (!in_array($user['plan'], ['solo', 'pro', 'business'])) {
            Response::error('Custom templates require a paid plan', 403);
        }
        
        $request = new Request();
        $data = $request->validate([
            'category' => 'required',
            'subject' => 'required|max:255',
            'content' => 'required',
        ]);
        
        $category = $request->input('category');
        $templateModel = new MessageTemplate();
        
        // Check if template exists for this category
        $existing = $templateModel
            ->where('user_id', Auth::id())
            ->where('type', 'email')
            ->where('category', $category)
            ->first();
        
        $templateData = [
            'user_id' => Auth::id(),
            'name' => $request->input('name', ucfirst($category) . ' Email'),
            'type' => 'email',
            'category' => $category,
            'subject' => $request->input('subject'),
            'content' => $request->input('content'),
            'is_default' => $request->input('is_default', 1),
            'status' => 'active',
        ];
        
        if ($existing) {
            MessageTemplate::query()->update($existing['id'], $templateData);
            $template = MessageTemplate::query()->find($existing['id']);
        } else {
            $id = MessageTemplate::query()->create($templateData);
            $template = MessageTemplate::query()->find($id);
        }
        
        Response::json($template, $existing ? 200 : 201);
    }
    
    /**
     * Create or update an SMS template
     */
    public function saveSmsTemplate(): void {
        $user = Auth::user();
        
        // Check if user has paid plan
        if (!in_array($user['plan'], ['solo', 'pro', 'business'])) {
            Response::error('Custom templates require a paid plan', 403);
        }
        
        $request = new Request();
        $data = $request->validate([
            'category' => 'required',
            'content' => 'required|max:160',
        ]);
        
        $category = $request->input('category');
        $templateModel = new MessageTemplate();
        
        // Check if template exists for this category
        $existing = $templateModel
            ->where('user_id', Auth::id())
            ->where('type', 'sms')
            ->where('category', $category)
            ->first();
        
        $templateData = [
            'user_id' => Auth::id(),
            'name' => $request->input('name', ucfirst($category) . ' SMS'),
            'type' => 'sms',
            'category' => $category,
            'subject' => '',
            'content' => $request->input('content'),
            'is_default' => $request->input('is_default', 1),
            'status' => 'active',
        ];
        
        if ($existing) {
            MessageTemplate::query()->update($existing['id'], $templateData);
            $template = MessageTemplate::query()->find($existing['id']);
        } else {
            $id = MessageTemplate::query()->create($templateData);
            $template = MessageTemplate::query()->find($id);
        }
        
        Response::json($template, $existing ? 200 : 201);
    }
    
    /**
     * Get a specific template
     */
    public function show(array $params): void {
        $template = MessageTemplate::query()->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        Response::json($template);
    }
    
    /**
     * Update a template
     */
    public function update(array $params): void {
        $template = MessageTemplate::query()->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        $user = Auth::user();
        if (!in_array($user['plan'], ['solo', 'pro', 'business'])) {
            Response::error('Custom templates require a paid plan', 403);
        }
        
        $request = new Request();
        $updateData = array_intersect_key($request->all(), array_flip([
            'name', 'subject', 'content', 'is_default', 'status'
        ]));
        
        MessageTemplate::query()->update($template['id'], $updateData);
        
        $updated = MessageTemplate::query()->find($template['id']);
        Response::json($updated);
    }
    
    /**
     * Delete a template
     */
    public function destroy(array $params): void {
        $template = MessageTemplate::query()->find((int) $params['id']);
        
        if (!$template || $template['user_id'] !== Auth::id()) {
            Response::error('Template not found', 404);
        }
        
        MessageTemplate::query()->delete($template['id']);
        Response::success();
    }
    
    /**
     * Reset templates to defaults
     */
    public function resetToDefaults(): void {
        $request = new Request();
        $type = $request->input('type', 'email');
        
        // Delete existing templates of this type
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM message_templates WHERE user_id = ? AND type = ?");
        $stmt->execute([Auth::id(), $type]);
        
        Response::json(['message' => 'Templates reset to defaults']);
    }
}
