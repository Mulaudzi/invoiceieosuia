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
        foreach ($invoices as $inv) {
            if ($inv['status'] === 'Paid') {
                $paidTotal += (float) $inv['total'];
            }
        }
        
        $client['total_revenue'] = $paidTotal;
        $client['invoice_count'] = count($invoices);
        
        return $client;
    }
}
