<?php

class PaymentController {
    public function index(): void {
        $request = new Request();
        $query = Payment::query()->where('user_id', Auth::id());
        
        $method = $request->query('method');
        if ($method) {
            $query->where('method', $method);
        }
        
        $payments = $query->orderBy('date', 'DESC')->get();
        
        // Add invoice and client to each payment
        $payments = array_map(function($payment) {
            $invoice = Invoice::query()->find($payment['invoice_id']);
            if ($invoice) {
                $invoice['client'] = Client::query()->find($invoice['client_id']);
            }
            $payment['invoice'] = $invoice;
            return $payment;
        }, $payments);
        
        // Apply search filter
        $search = $request->query('search');
        if ($search) {
            $search = strtolower($search);
            $payments = array_filter($payments, function($p) use ($search) {
                $invoiceNumber = strtolower($p['invoice']['invoice_number'] ?? '');
                $clientName = strtolower($p['invoice']['client']['name'] ?? '');
                return str_contains($invoiceNumber, $search) || str_contains($clientName, $search);
            });
            $payments = array_values($payments);
        }
        
        Response::json($payments);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'invoice_id' => 'required|numeric',
            'amount' => 'required|numeric',
            'method' => 'required',
            'date' => 'required',
        ]);
        
        $data = array_merge($request->all(), ['user_id' => Auth::id()]);
        
        $id = Payment::query()->create($data);
        
        // Check if invoice is fully paid
        $invoice = Invoice::query()->find($data['invoice_id']);
        $invoiceModel = new Invoice();
        $invoiceWithRelations = $invoiceModel->withRelations($invoice);
        
        if ($invoiceWithRelations['balance_due'] <= 0) {
            Invoice::query()->update($invoice['id'], ['status' => 'Paid']);
        }
        
        $payment = Payment::query()->find($id);
        $payment['invoice'] = Invoice::query()->find($payment['invoice_id']);
        $payment['invoice']['client'] = Client::query()->find($payment['invoice']['client_id']);
        
        Response::json($payment, 201);
    }
    
    public function show(array $params): void {
        $payment = Payment::query()->find((int) $params['id']);
        
        if (!$payment || $payment['user_id'] !== Auth::id()) {
            Response::error('Payment not found', 404);
        }
        
        $payment['invoice'] = Invoice::query()->find($payment['invoice_id']);
        $payment['invoice']['client'] = Client::query()->find($payment['invoice']['client_id']);
        
        Response::json($payment);
    }
    
    public function destroy(array $params): void {
        $payment = Payment::query()->find((int) $params['id']);
        
        if (!$payment || $payment['user_id'] !== Auth::id()) {
            Response::error('Payment not found', 404);
        }
        
        $invoice = Invoice::query()->find($payment['invoice_id']);
        
        Payment::query()->delete($payment['id']);
        
        // Revert invoice status if needed
        if ($invoice && $invoice['status'] === 'Paid') {
            $invoiceModel = new Invoice();
            $invoiceWithRelations = $invoiceModel->withRelations($invoice);
            if ($invoiceWithRelations['balance_due'] > 0) {
                Invoice::query()->update($invoice['id'], ['status' => 'Pending']);
            }
        }
        
        Response::success();
    }
    
    public function summary(): void {
        $payments = Payment::query()->where('user_id', Auth::id())->get();
        
        $total = array_sum(array_column($payments, 'amount'));
        
        $byMethod = [];
        foreach ($payments as $p) {
            $method = $p['method'];
            if (!isset($byMethod[$method])) {
                $byMethod[$method] = ['method' => $method, 'total' => 0, 'count' => 0];
            }
            $byMethod[$method]['total'] += (float) $p['amount'];
            $byMethod[$method]['count']++;
        }
        
        Response::json([
            'total_received' => $total,
            'count' => count($payments),
            'by_method' => array_values($byMethod)
        ]);
    }
}
