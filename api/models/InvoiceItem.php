<?php

class InvoiceItem extends Model {
    protected static string $table = 'invoice_items';
    protected static array $fillable = [
        'invoice_id', 'product_id', 'name', 'description',
        'quantity', 'price', 'tax_rate', 'subtotal', 'tax', 'total'
    ];
    
    public function createWithCalculation(array $data): int {
        $quantity = (int) $data['quantity'];
        $price = (float) $data['price'];
        $taxRate = (float) ($data['tax_rate'] ?? 0);
        
        $subtotal = $quantity * $price;
        $tax = $subtotal * ($taxRate / 100);
        $total = $subtotal + $tax;
        
        $data['subtotal'] = $subtotal;
        $data['tax'] = $tax;
        $data['total'] = $total;
        
        return $this->create($data);
    }
    
    public function deleteByInvoice(int $invoiceId): bool {
        $stmt = $this->db->prepare("DELETE FROM " . static::$table . " WHERE invoice_id = ?");
        return $stmt->execute([$invoiceId]);
    }
}
