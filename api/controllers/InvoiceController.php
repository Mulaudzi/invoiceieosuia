<?php

class InvoiceController {
    public function index(): void {
        $request = new Request();
        $query = Invoice::query()->where('user_id', Auth::id());
        
        $status = $request->query('status');
        if ($status) {
            $query->where('status', $status);
        }
        
        $clientId = $request->query('client_id');
        if ($clientId) {
            $query->where('client_id', (int) $clientId);
        }
        
        $invoices = $query->orderBy('date', 'DESC')->get();
        
        // Apply search filter
        $search = $request->query('search');
        if ($search) {
            $search = strtolower($search);
            $invoices = array_filter($invoices, function($inv) use ($search) {
                $client = Client::query()->find($inv['client_id']);
                return str_contains(strtolower($inv['invoice_number']), $search) ||
                       ($client && str_contains(strtolower($client['name']), $search));
            });
            $invoices = array_values($invoices);
        }
        
        // Add client to each invoice
        $invoices = array_map(function($inv) {
            $inv['client'] = Client::query()->find($inv['client_id']);
            return $inv;
        }, $invoices);
        
        Response::json($invoices);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'client_id' => 'required|numeric',
            'date' => 'required',
            'due_date' => 'required',
        ]);
        
        $user = Auth::user();
        $userModel = new User();
        
        if (!$userModel->canCreateInvoice($user['id'], $user['plan'])) {
            Response::error('Invoice limit reached for your plan', 403);
        }
        
        $invoiceModel = Invoice::query();
        
        $invoiceData = [
            'user_id' => Auth::id(),
            'client_id' => $request->input('client_id'),
            'template_id' => $request->input('template_id'),
            'invoice_number' => $invoiceModel->generateNumber(Auth::id()),
            'date' => $request->input('date'),
            'due_date' => $request->input('due_date'),
            'notes' => $request->input('notes'),
            'terms' => $request->input('terms'),
            'status' => 'Draft',
            'subtotal' => 0,
            'tax' => 0,
            'total' => 0
        ];
        
        $invoiceId = $invoiceModel->create($invoiceData);
        
        // Create items
        $items = $request->input('items', []);
        $itemModel = new InvoiceItem();
        
        foreach ($items as $item) {
            $item['invoice_id'] = $invoiceId;
            $itemModel->createWithCalculation($item);
        }
        
        // Recalculate totals
        $invoiceModel->recalculateTotals($invoiceId);
        
        $invoice = $invoiceModel->find($invoiceId);
        $invoice = $invoiceModel->withRelations($invoice);
        
        Response::json($invoice, 201);
    }
    
    public function show(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $invoiceModel = new Invoice();
        Response::json($invoiceModel->withRelations($invoice));
    }
    
    public function update(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $request = new Request();
        $data = $request->all();
        
        // Update invoice
        $updateData = array_intersect_key($data, array_flip([
            'client_id', 'template_id', 'date', 'due_date', 'notes', 'terms', 'status'
        ]));
        
        Invoice::query()->update($invoice['id'], $updateData);
        
        // Update items if provided
        if (isset($data['items'])) {
            $itemModel = new InvoiceItem();
            $itemModel->deleteByInvoice($invoice['id']);
            
            foreach ($data['items'] as $item) {
                $item['invoice_id'] = $invoice['id'];
                $itemModel->createWithCalculation($item);
            }
            
            Invoice::query()->recalculateTotals($invoice['id']);
        }
        
        $updated = Invoice::query()->find($invoice['id']);
        $invoiceModel = new Invoice();
        Response::json($invoiceModel->withRelations($updated));
    }
    
    public function destroy(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        // Delete items first
        $itemModel = new InvoiceItem();
        $itemModel->deleteByInvoice($invoice['id']);
        
        Invoice::query()->delete($invoice['id']);
        Response::success();
    }
    
    public function markPaid(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        Invoice::query()->update($invoice['id'], ['status' => 'Paid']);
        
        $updated = Invoice::query()->find($invoice['id']);
        $invoiceModel = new Invoice();
        Response::json($invoiceModel->withRelations($updated));
    }
}
