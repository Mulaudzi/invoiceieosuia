<?php

class Invoice extends Model {
    protected static string $table = 'invoices';
    protected static array $fillable = [
        'user_id', 'client_id', 'template_id', 'recurring_invoice_id', 'invoice_number',
        'category', 'document_type', 'template_slug', 'template_version', 'metadata', 'template_snapshot',
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
        
        foreach (['metadata', 'template_snapshot'] as $jsonField) {
            if (isset($invoice[$jsonField]) && is_string($invoice[$jsonField])) {
                $invoice[$jsonField] = json_decode($invoice[$jsonField], true) ?: [];
            }
        }
        $metadata = is_array($invoice['metadata'] ?? null) ? $invoice['metadata'] : [];
        $documentType = (string) ($invoice['document_type'] ?? 'standard_invoice');
        $invoice['base_subtotal'] = (float) $invoice['subtotal'];
        $invoice['base_tax'] = (float) $invoice['tax'];
        $invoice['base_total'] = (float) $invoice['total'];
        $invoice['credit_total'] = 0.0;
        $invoice['debit_total'] = 0.0;
        $invoice['linked_documents'] = [];
        if (!in_array($documentType, ['credit_note', 'debit_note', 'receipt'], true)) {
            $adjustments = $this->linkedAdjustments((int) $invoice['id'], (int) $invoice['user_id'], (int) $invoice['client_id']);
            $invoice['credit_total'] = $adjustments['credit_total'];
            $invoice['debit_total'] = $adjustments['debit_total'];
            $invoice['linked_documents'] = $adjustments['documents'];
            $invoice['subtotal'] = max(0, (float) $invoice['subtotal'] + $adjustments['debit_subtotal'] - $adjustments['credit_subtotal']);
            $invoice['tax'] = max(0, (float) $invoice['tax'] + $adjustments['debit_tax'] - $adjustments['credit_tax']);
            $invoice['total'] = max(0, (float) $invoice['total'] + $adjustments['debit_total'] - $adjustments['credit_total']);
        }
        $history = is_array($metadata['payment_history'] ?? null) ? $metadata['payment_history'] : [];
        // Older one-off invoices could be marked Paid before payment ledgers were
        // introduced. Expose that full payment as a manageable compatibility row.
        if ($invoice['status'] === 'Paid' && count($history) === 0 && (float) $invoice['total'] > 0) {
            $paymentDate = substr((string) ($metadata['payment_date'] ?? $invoice['date'] ?? date('Y-m-d')), 0, 10);
            $history[] = [
                'id' => 'legacy-full-payment',
                'amount' => round((float) $invoice['base_total'], 2),
                'payment_date' => $paymentDate,
                'reference' => 'Paid in full',
                'created_at' => $metadata['payment_date'] ?? ($invoice['updated_at'] ?? $invoice['date'] ?? null),
            ];
        }
        $paid = array_reduce($history, fn(float $sum, array $payment): float => !empty($payment['voided_at']) || ($payment['status'] ?? '') === 'voided' ? $sum : $sum + max(0, (float) ($payment['amount'] ?? 0)), 0.0);
        if ($invoice['status'] === 'Paid' && $paid <= 0) $paid = (float) $invoice['total'];
        $invoice['payment_history'] = $history;
        $invoice['amount_paid'] = min((float) $invoice['total'], $paid);
        $invoice['balance_due'] = max(0, (float) $invoice['total'] - $invoice['amount_paid']);
        if (($invoice['status'] ?? '') !== 'Draft' && $invoice['balance_due'] <= 0) $invoice['status'] = 'Paid';
        if ($invoice['amount_paid'] > 0 && $invoice['balance_due'] > 0) $invoice['status'] = 'Partially Paid';
        if ($invoice['balance_due'] > 0 && ($invoice['status'] ?? '') !== 'Draft' && !empty($invoice['due_date']) && $invoice['due_date'] < date('Y-m-d')) $invoice['status'] = 'Overdue';
        
        return $invoice;
    }

    private function linkedAdjustments(int $invoiceId, int $userId, int $clientId): array {
        $stmt = $this->db->prepare("SELECT id, invoice_number, document_type, status, date, subtotal, tax, total, metadata FROM invoices WHERE user_id = ? AND client_id = ? AND document_type IN ('credit_note','debit_note','receipt') ORDER BY date DESC, id DESC");
        $stmt->execute([$userId, $clientId]);
        $result = ['credit_subtotal'=>0.0, 'credit_tax'=>0.0, 'credit_total'=>0.0, 'debit_subtotal'=>0.0, 'debit_tax'=>0.0, 'debit_total'=>0.0, 'documents'=>[]];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $document) {
            $documentMetadata = json_decode((string) ($document['metadata'] ?? ''), true) ?: [];
            if ((int) ($documentMetadata['original_invoice_id'] ?? 0) !== $invoiceId) continue;
            $document['metadata'] = $documentMetadata;
            $result['documents'][] = $document;
            $type = (string) $document['document_type'];
            if (!in_array($type, ['credit_note', 'debit_note'], true)) continue;
            // Draft and pending notes remain linked and visible, but only an
            // explicitly applied/paid note changes the original invoice.
            if (!in_array((string) ($document['status'] ?? ''), ['Applied', 'Paid'], true)) continue;
            $side = $type === 'credit_note' ? 'credit' : 'debit';
            $result[$side . '_subtotal'] += max(0, (float) $document['subtotal']);
            $result[$side . '_tax'] += max(0, (float) $document['tax']);
            $result[$side . '_total'] += max(0, (float) $document['total']);
        }
        foreach ($result as $key => $value) if ($key !== 'documents') $result[$key] = round((float) $value, 2);
        return $result;
    }
    
    public function generateNumber(int $userId): string {
        return $this->generateDocumentNumber($userId, 'standard_invoice');
    }

    public function generateDocumentNumber(int $userId, string $documentType): string {
        $prefixes = ['credit_note' => 'CN', 'debit_note' => 'DN', 'receipt' => 'REC', 'quote' => 'QUO', 'pro_forma' => 'PRO'];
        $prefix = $prefixes[$documentType] ?? 'INV';
        if (isset($prefixes[$documentType])) {
            $stmt = $this->db->prepare('SELECT invoice_number FROM invoices WHERE user_id = ? AND document_type = ?');
            $stmt->execute([$userId, $documentType]);
        } else {
            $stmt = $this->db->prepare("SELECT invoice_number FROM invoices WHERE user_id = ? AND document_type NOT IN ('credit_note','debit_note','receipt','quote','pro_forma')");
            $stmt->execute([$userId]);
        }
        $highest = 0;
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $number) {
            if (preg_match('/^' . preg_quote($prefix, '/') . '(?:-\d{4})?-(\d+)$/', (string) $number, $matches)) {
                $highest = max($highest, (int) $matches[1]);
            }
        }
        do {
            $highest++;
            $candidate = $prefix . '-' . str_pad((string) $highest, 4, '0', STR_PAD_LEFT);
            $check = $this->db->prepare('SELECT COUNT(*) FROM invoices WHERE user_id = ? AND invoice_number = ?');
            $check->execute([$userId, $candidate]);
        } while ((int) $check->fetchColumn() > 0);
        return $candidate;
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
