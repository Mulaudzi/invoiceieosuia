<?php

class Invoice extends Model {
    protected static string $table = 'invoices';
    protected static array $fillable = [
        'user_id', 'client_id', 'template_id', 'recurring_invoice_id', 'invoice_number',
        'date', 'due_date', 'subtotal', 'tax', 'total',
        'status', 'notes', 'terms', 'currency', 'exchange_rate', 'base_total'
    ];
    
    public function withRelations(array $invoice): array {
        // Get client
        $client = Client::query()->find($invoice['client_id']);
        $invoice['client'] = $client;
        
        // Get items
        $invoice['items'] = InvoiceItem::query()
            ->where('invoice_id', $invoice['id'])
            ->get();
        
        // Calculate balance due
        $payments = Payment::query()
            ->where('invoice_id', $invoice['id'])
            ->get();
        
        $paidAmount = array_sum(array_column($payments, 'amount'));
        $invoice['balance_due'] = (float) $invoice['total'] - $paidAmount;
        $invoice['payments'] = $payments;
        
        return $invoice;
    }
    
    public function generateNumber(int $userId): string {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) as count FROM " . static::$table . " WHERE user_id = ?"
        );
        $stmt->execute([$userId]);
        $count = $stmt->fetch()['count'] + 1;
        
        return 'INV-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
    
    public function recalculateTotals(int $invoiceId): void {
        $items = InvoiceItem::query()
            ->where('invoice_id', $invoiceId)
            ->get();
        
        $subtotal = 0;
        $tax = 0;
        
        foreach ($items as $item) {
            $subtotal += (float) $item['subtotal'];
            $tax += (float) $item['tax'];
        }
        
        $this->update($invoiceId, [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax
        ]);
    }
}
