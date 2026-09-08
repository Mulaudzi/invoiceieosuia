<?php

class InvoiceItem extends Model {
    protected static string $table = 'invoice_items';
    protected static array $fillable = [
        'invoice_id', 'product_id', 'name', 'description',
        'sku', 'unit', 'group_name', 'metadata', 'quantity', 'price', 'discount_rate', 'tax_rate', 'subtotal', 'tax', 'total'
    ];
    
    public function createWithCalculation(array $data): int {
        $quantity = (int) $data['quantity'];
        $price = (float) $data['price'];
        $taxRate = (float) ($data['tax_rate'] ?? 0);
        
        $discountRate = max(0, min(100, (float) ($data['discount_rate'] ?? 0)));
        $subtotal = $quantity * $price * (1 - $discountRate / 100);
        $tax = $subtotal * ($taxRate / 100);
        $total = $subtotal + $tax;
        
        $data['subtotal'] = $subtotal;
        $data['discount_rate'] = $discountRate;
        $data['tax'] = $tax;
        $data['total'] = $total;
        
        return $this->create($data);
    }
    
    public function deleteByInvoice(int $invoiceId): bool {
        $stmt = $this->db->prepare("DELETE FROM " . static::$table . " WHERE invoice_id = ?");
        return $stmt->execute([$invoiceId]);
    }
}
