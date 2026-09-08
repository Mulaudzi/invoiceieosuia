<?php

class Client extends Model {
    protected static string $table = 'clients';
    protected static array $fillable = [
        'user_id', 'name', 'email', 'phone', 'company',
        'address', 'tax_number', 'status', 'notes', 'currency', 'plan', 'group_id'
    ];
    
    public function withStats(array $client): array {
        $invoices = Invoice::query()
            ->where('client_id', $client['id'])
            ->get();
        
        $paidTotal = 0;
        $outstanding = 0;
        $documents = [];
        $invoiceModel = new Invoice();
        foreach ($invoices as $rawInvoice) {
            $inv = $invoiceModel->withRelations($rawInvoice);
            $documents[] = [
                'id' => $inv['id'], 'invoice_number' => $inv['invoice_number'],
                'document_type' => $inv['document_type'] ?? 'standard_invoice',
                'status' => $inv['status'], 'date' => $inv['date'], 'total' => (float) $inv['total'],
                'balance_due' => (float) $inv['balance_due'],
                'original_invoice_id' => $inv['metadata']['original_invoice_id'] ?? null,
                'original_invoice_number' => $inv['metadata']['original_invoice_number'] ?? null,
            ];
            if (in_array(($inv['document_type'] ?? ''), ['credit_note', 'debit_note', 'receipt'], true)) continue;
            $paidTotal += (float) $inv['amount_paid'];
            $outstanding += (float) $inv['balance_due'];
        }
        
        $client['total_revenue'] = $paidTotal;
        $client['invoice_count'] = count($invoices);
        $client['outstanding_balance'] = round($outstanding, 2);
        $client['documents'] = $documents;
        
        return $client;
    }
}
