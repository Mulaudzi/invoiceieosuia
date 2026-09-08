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
        
        // Include the same relations returned by show/store so list records can
        // be opened for editing without a second, incomplete data shape.
        $invoiceModel = new Invoice();
        $invoices = array_map(
            fn(array $invoice): array => $invoiceModel->withRelations($invoice),
            $invoices
        );
        
        Response::json([
            'data' => $invoices,
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => count($invoices),
            'total' => count($invoices)
        ]);
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

        $client = Client::query()->find((int) $request->input('client_id'));
        if (!$client || (int) $client['user_id'] !== Auth::id()) {
            Response::error('Client not found', 404);
            return;
        }

        $templateId = $request->input('template_id');
        if ($templateId) {
            $template = Template::query()->find((int) $templateId);
            if (!$template || !in_array((int) $template['user_id'], [0, Auth::id()], true)) {
                Response::error('Template not found', 404);
                return;
            }
        }
        $recurringInvoiceId = $request->input('recurring_invoice_id');
        $schedule = null;
        if ($recurringInvoiceId) {
            $scheduleStmt = Database::getConnection()->prepare('SELECT * FROM recurring_invoices WHERE id = ? AND user_id = ?');
            $scheduleStmt->execute([(int) $recurringInvoiceId, Auth::id()]);
            $schedule = $scheduleStmt->fetch(PDO::FETCH_ASSOC);
            if (!$schedule) { Response::error('Billing schedule not found', 404); return; }
            $duplicateStmt = Database::getConnection()->prepare("SELECT id, invoice_number, status, metadata FROM invoices WHERE recurring_invoice_id = ? AND user_id = ? ORDER BY id DESC");
            $duplicateStmt->execute([(int) $recurringInvoiceId, Auth::id()]);
            foreach ($duplicateStmt->fetchAll(PDO::FETCH_ASSOC) as $existing) {
                $existingMetadata = json_decode((string) ($existing['metadata'] ?? ''), true) ?: [];
                if (($existingMetadata['billing_cycle_date'] ?? null) === $schedule['next_invoice_date'] || $existing['status'] !== 'Paid') {
                    Response::error('An invoice already exists for this billing cycle: ' . $existing['invoice_number'], 409); return;
                }
            }
        }
        
        if (!$userModel->canCreateInvoice($user['id'], $user['plan'])) {
            Response::error('Invoice limit reached for your plan', 403);
        }
        
        $invoiceModel = Invoice::query();
        
        $metadata = $this->safeMetadata($request->input('metadata', []));
        if ($schedule) $metadata['billing_cycle_date'] = $schedule['next_invoice_date'];
        $documentType = $this->allowedDocumentType((string) $request->input('document_type', 'standard_invoice'));
        $originalInvoice = null;
        if (!empty($metadata['original_invoice_id'])) {
            $originalInvoice = Invoice::query()->find((int) $metadata['original_invoice_id']);
            if (!$originalInvoice || (int) $originalInvoice['user_id'] !== Auth::id() || (int) $originalInvoice['client_id'] !== (int) $request->input('client_id')) {
                Response::error('The original invoice could not be linked to this document. Please reopen it from the invoice Actions menu.', 422);
                return;
            }
            $metadata['original_invoice_number'] = $originalInvoice['invoice_number'];
        }
        $items = $request->input('items', []);
        $requestedTotal = 0.0;
        foreach ($items as $item) {
            $quantity = max(0, (float) ($item['quantity'] ?? 0));
            $price = max(0, (float) ($item['price'] ?? 0));
            $discountRate = max(0, min(100, (float) ($item['discount_rate'] ?? 0)));
            $taxRate = max(0, min(100, (float) ($item['tax_rate'] ?? 0)));
            $lineSubtotal = $quantity * $price * (1 - $discountRate / 100);
            $requestedTotal += $lineSubtotal + ($lineSubtotal * $taxRate / 100);
        }
        if ($originalInvoice && in_array($documentType, ['credit_note', 'debit_note'], true)) {
            if ($requestedTotal <= 0) {
                Response::error($documentType === 'credit_note' ? 'Add at least one item or amount to credit.' : 'Add at least one additional item or amount to charge.', 422);
                return;
            }
            if ($documentType === 'credit_note') {
                $originalWithAdjustments = (new Invoice())->withRelations($originalInvoice);
                if ($requestedTotal > (float) $originalWithAdjustments['total'] + 0.005) {
                    Response::error('The credit amount cannot be greater than the remaining adjusted invoice total.', 422);
                    return;
                }
            }
        }
        $duplicateConfirmed = filter_var($request->input('duplicate_confirmed', false), FILTER_VALIDATE_BOOLEAN);
        if (!$duplicateConfirmed && !$recurringInvoiceId && empty($metadata['original_invoice_id'])) {
            $duplicateCheck = Database::getConnection()->prepare('SELECT id, invoice_number, total FROM invoices WHERE user_id = ? AND client_id = ? AND date = ? ORDER BY id DESC');
            $duplicateCheck->execute([Auth::id(), (int) $request->input('client_id'), (string) $request->input('date')]);
            foreach ($duplicateCheck->fetchAll(PDO::FETCH_ASSOC) as $existingInvoice) {
                if (abs((float) $existingInvoice['total'] - $requestedTotal) < 0.005) {
                    Response::json([
                        'error' => 'A possible duplicate invoice already exists for this client, date, and amount.',
                        'message' => 'A possible duplicate invoice already exists for this client, date, and amount.',
                        'duplicate_warning' => true,
                        'existing_invoice_number' => $existingInvoice['invoice_number'],
                    ], 409);
                    return;
                }
            }
        }
        $invoiceData = [
            'user_id' => Auth::id(),
            'client_id' => $request->input('client_id'),
            'template_id' => $request->input('template_id'),
            'recurring_invoice_id' => $recurringInvoiceId ?: null,
            'category' => $this->allowedCategory((string) $request->input('category', 'general')),
            'document_type' => $documentType,
            'template_slug' => $this->cleanSlug((string) $request->input('template_slug', 'general-classic')),
            'template_version' => max(1, (int) $request->input('template_version', 1)),
            'metadata' => json_encode($metadata),
            'template_snapshot' => json_encode(['slug' => $this->cleanSlug((string) $request->input('template_slug', 'general-classic')), 'version' => max(1, (int) $request->input('template_version', 1))]),
            'invoice_number' => $invoiceModel->generateDocumentNumber(Auth::id(), $documentType),
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
        $itemModel = new InvoiceItem();
        
        foreach ($items as $item) {
            $item['invoice_id'] = $invoiceId;
            $itemModel->createWithCalculation($item);
        }
        
        // Recalculate totals
        $invoiceModel->recalculateTotals($invoiceId);
        if ($documentType === 'receipt' && $originalInvoice) {
            $created = $invoiceModel->find($invoiceId);
            $receiptTotal = round((float) ($created['total'] ?? 0), 2);
            $metadata['payment_history'] = [[
                'id' => bin2hex(random_bytes(8)), 'amount' => $receiptTotal,
                'payment_date' => (string) $request->input('date'),
                'reference' => 'Receipt for ' . $originalInvoice['invoice_number'], 'created_at' => date('c'),
            ]];
            $metadata['payment_date'] = (string) $request->input('date') . ' 00:00:00';
            Invoice::query()->update($invoiceId, ['status' => 'Paid', 'metadata' => json_encode($metadata)]);
        }
        
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

        if (isset($data['client_id'])) {
            $client = Client::query()->find((int) $data['client_id']);
            if (!$client || (int) $client['user_id'] !== Auth::id()) {
                Response::error('Client not found', 404);
                return;
            }
        }

        if (!empty($data['template_id'])) {
            $template = Template::query()->find((int) $data['template_id']);
            if (!$template || !in_array((int) $template['user_id'], [0, Auth::id()], true)) {
                Response::error('Template not found', 404);
                return;
            }
        }

        if (isset($data['items']) && in_array((string) ($invoice['document_type'] ?? ''), ['credit_note', 'debit_note'], true)) {
            $newTotal = 0.0;
            foreach ($data['items'] as $item) {
                $quantity = max(0, (float) ($item['quantity'] ?? 0));
                $price = max(0, (float) ($item['price'] ?? 0));
                $discount = max(0, min(100, (float) ($item['discount_rate'] ?? 0)));
                $taxRate = max(0, min(100, (float) ($item['tax_rate'] ?? 0)));
                $line = $quantity * $price * (1 - $discount / 100);
                $newTotal += $line + ($line * $taxRate / 100);
            }
            if ($newTotal <= 0) Response::error(($invoice['document_type'] ?? '') === 'credit_note' ? 'Add at least one item or amount to credit.' : 'Add at least one additional item or amount to charge.', 422);
            $existingMetadata = json_decode((string) ($invoice['metadata'] ?? ''), true) ?: [];
            if (($invoice['document_type'] ?? '') === 'credit_note' && !empty($existingMetadata['original_invoice_id'])) {
                $original = $this->ownedInvoice((int) $existingMetadata['original_invoice_id']);
                $adjustedOriginal = (new Invoice())->withRelations($original);
                $availableBeforeThisCredit = (float) $adjustedOriginal['total'] + (float) $invoice['total'];
                if ($newTotal > $availableBeforeThisCredit + 0.005) Response::error('The credit amount cannot be greater than the remaining adjusted invoice total.', 422);
            }
        }
        
        // Update invoice
        $updateData = array_intersect_key($data, array_flip([
            'client_id', 'template_id', 'date', 'due_date', 'notes', 'terms', 'status',
            'category', 'document_type', 'template_slug', 'template_version'
        ]));
        if (isset($updateData['category'])) $updateData['category'] = $this->allowedCategory((string) $updateData['category']);
        if (isset($updateData['document_type'])) $updateData['document_type'] = $this->allowedDocumentType((string) $updateData['document_type']);
        if (isset($updateData['template_slug'])) $updateData['template_slug'] = $this->cleanSlug((string) $updateData['template_slug']);
        if (array_key_exists('metadata', $data)) {
            $existingMetadata = json_decode((string) ($invoice['metadata'] ?? ''), true) ?: [];
            $safeMetadata = $this->safeMetadata($data['metadata']);
            foreach (['payment_history', 'payment_date', 'issued_at', 'billing_cycle_date'] as $protectedKey) {
                if (array_key_exists($protectedKey, $existingMetadata)) $safeMetadata[$protectedKey] = $existingMetadata[$protectedKey];
            }
            $updateData['metadata'] = json_encode($safeMetadata);
        }
        
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

        if (($invoice['status'] ?? '') === 'Paid') {
            $invoiceModel = new Invoice();
            Response::json($invoiceModel->withRelations($invoice));
        }
        
        $related = (new Invoice())->withRelations($invoice);
        $this->recordPaymentForInvoice($invoice, (float) $related['balance_due'], date('Y-m-d'), 'Marked as paid');
    }

    public function recordPayment(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) Response::error('Invoice not found', 404);
        if (($invoice['status'] ?? '') === 'Draft') Response::error('Issue the draft invoice before recording payments', 422);
        $request = new Request();
        $amount = (float) $request->input('amount', 0);
        if (!is_finite($amount) || $amount <= 0) Response::error('Payment amount must be greater than zero', 422);
        $date = (string) $request->input('payment_date', date('Y-m-d'));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) Response::error('Payment date is invalid', 422);
        $reference = mb_substr(trim((string) $request->input('reference', '')), 0, 160);
        $requestId = mb_substr(trim((string) $request->input('request_id', '')), 0, 100);
        $this->recordPaymentForInvoice($invoice, $amount, $date, $reference, $requestId);
    }

    private function recordPaymentForInvoice(array $invoice, float $amount, string $date, string $reference, string $requestId = ''): void {
        $related = (new Invoice())->withRelations($invoice);
        $balance = (float) $related['balance_due'];
        if ($balance <= 0) Response::json($related);
        if ($amount > $balance + 0.005) Response::error('Payment exceeds the outstanding balance', 422);
        $metadata = is_array($related['metadata'] ?? null) ? $related['metadata'] : [];
        $history = is_array($metadata['payment_history'] ?? null) ? $metadata['payment_history'] : [];
        if ($requestId !== '') foreach ($history as $existingPayment) if (($existingPayment['request_id'] ?? '') === $requestId) Response::json($related);
        if (($invoice['status'] ?? '') === 'Draft') Response::error('Issue the draft invoice before recording payments', 422);
        $history[] = ['id' => bin2hex(random_bytes(8)), 'amount' => round($amount, 2), 'payment_date' => $date, 'reference' => $reference, 'request_id' => $requestId, 'created_at' => date('c')];
        $metadata['payment_history'] = $history;
        $remaining = max(0, $balance - $amount);
        $fullyPaid = $remaining < 0.005;
        if ($fullyPaid) $metadata['payment_date'] = $date . ' 00:00:00';
        // Keep partial rows database-compatible with older installations; the
        // response model derives the visible Partially Paid status from its ledger.
        Invoice::query()->update($invoice['id'], ['status' => $fullyPaid ? 'Paid' : 'Pending', 'metadata' => json_encode($metadata)]);
        if ($fullyPaid && !empty($invoice['recurring_invoice_id'])) $this->advanceBillingSchedule((int) $invoice['recurring_invoice_id']);
        Response::json((new Invoice())->withRelations(Invoice::query()->find($invoice['id'])));
    }

    public function issue(array $params): void {
        $invoice = Invoice::query()->find((int) $params['id']);
        if (!$invoice || (int) $invoice['user_id'] !== Auth::id()) Response::error('Invoice not found', 404);
        if (($invoice['status'] ?? '') !== 'Draft') Response::error('Only draft invoices can be issued', 422);
        if ((float) $invoice['total'] <= 0) Response::error('Add at least one invoice item before issuing', 422);
        $metadata = json_decode((string) ($invoice['metadata'] ?? ''), true) ?: [];
        $metadata['issued_at'] = date('c');
        Invoice::query()->update($invoice['id'], ['status' => 'Pending', 'metadata' => json_encode($metadata)]);
        Response::json((new Invoice())->withRelations(Invoice::query()->find($invoice['id'])));
    }

    public function updatePayment(array $params): void {
        $invoice = $this->ownedInvoice((int) $params['id']);
        $request = new Request();
        $amount = (float) $request->input('amount', 0);
        $date = (string) $request->input('payment_date', '');
        if (!is_finite($amount) || $amount <= 0) Response::error('Payment amount must be greater than zero', 422);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) Response::error('Payment date is invalid', 422);
        $metadata = json_decode((string) ($invoice['metadata'] ?? ''), true) ?: [];
        $history = is_array($metadata['payment_history'] ?? null) ? $metadata['payment_history'] : [];
        $history = $this->withLegacyFullPayment($invoice, $metadata, $history, (string) $params['paymentId']);
        $found = false;
        foreach ($history as &$payment) if (($payment['id'] ?? '') === (string) $params['paymentId']) {
            if (!empty($payment['voided_at'])) Response::error('A voided payment cannot be edited', 422);
            $payment = array_merge($payment, ['amount' => round($amount, 2), 'payment_date' => $date, 'reference' => mb_substr(trim((string) $request->input('reference', '')), 0, 160), 'updated_at' => date('c')]); $found = true; break;
        }
        unset($payment);
        if (!$found) Response::error('Payment not found', 404);
        $this->saveLedger($invoice, $metadata, $history);
    }

    public function voidPayment(array $params): void {
        $invoice = $this->ownedInvoice((int) $params['id']);
        $metadata = json_decode((string) ($invoice['metadata'] ?? ''), true) ?: [];
        $history = is_array($metadata['payment_history'] ?? null) ? $metadata['payment_history'] : [];
        $history = $this->withLegacyFullPayment($invoice, $metadata, $history, (string) $params['paymentId']);
        $found = false;
        foreach ($history as &$payment) if (($payment['id'] ?? '') === (string) $params['paymentId']) { if (!empty($payment['voided_at'])) Response::error('Payment is already voided', 422); $payment['status'] = 'voided'; $payment['voided_at'] = date('c'); $found = true; break; }
        unset($payment);
        if (!$found) Response::error('Payment not found', 404);
        $this->saveLedger($invoice, $metadata, $history);
    }

    private function withLegacyFullPayment(array $invoice, array $metadata, array $history, string $paymentId): array {
        if ($paymentId !== 'legacy-full-payment' || count($history) > 0 || ($invoice['status'] ?? '') !== 'Paid') return $history;
        $paymentDate = substr((string) ($metadata['payment_date'] ?? $invoice['date'] ?? date('Y-m-d')), 0, 10);
        $history[] = [
            'id' => 'legacy-full-payment',
            'amount' => round((float) $invoice['total'], 2),
            'payment_date' => $paymentDate,
            'reference' => 'Paid in full',
            'created_at' => $metadata['payment_date'] ?? ($invoice['updated_at'] ?? $invoice['date'] ?? date('c')),
        ];
        return $history;
    }

    private function ownedInvoice(int $id): array {
        $invoice = Invoice::query()->find($id);
        if (!$invoice || (int) $invoice['user_id'] !== Auth::id()) Response::error('Invoice not found', 404);
        return $invoice;
    }

    private function saveLedger(array $invoice, array $metadata, array $history): void {
        $wasPaid = ($invoice['status'] ?? '') === 'Paid';
        $effectiveInvoice = (new Invoice())->withRelations($invoice);
        $effectiveTotal = (float) $effectiveInvoice['total'];
        $paid = array_reduce($history, fn(float $sum, array $p): float => !empty($p['voided_at']) ? $sum : $sum + max(0, (float) ($p['amount'] ?? 0)), 0.0);
        if ($paid > $effectiveTotal + .005) Response::error('The recorded payments are greater than the adjusted invoice total. Review the credit note or payment history first.', 422);
        $nowPaid = ($effectiveTotal - $paid) < .005;
        $metadata['payment_history'] = $history;
        if ($nowPaid) $metadata['payment_date'] = date('Y-m-d H:i:s'); else unset($metadata['payment_date']);
        Invoice::query()->update($invoice['id'], ['status' => $nowPaid ? 'Paid' : 'Pending', 'metadata' => json_encode($metadata)]);
        if (!empty($invoice['recurring_invoice_id'])) {
            if (!$wasPaid && $nowPaid) $this->advanceBillingSchedule((int) $invoice['recurring_invoice_id']);
            if ($wasPaid && !$nowPaid) $this->restoreBillingSchedule((int) $invoice['recurring_invoice_id'], $metadata, $invoice);
        }
        Response::json((new Invoice())->withRelations(Invoice::query()->find($invoice['id'])));
    }

    private function restoreBillingSchedule(int $scheduleId, array $metadata, array $invoice): void {
        $cycle = (string) ($metadata['billing_cycle_date'] ?? $invoice['date']);
        $stmt = Database::getConnection()->prepare("UPDATE recurring_invoices SET next_invoice_date = ?, last_generated_at = NULL, total_generated = GREATEST(total_generated - 1, 0), status = CASE WHEN status = 'completed' THEN 'active' ELSE status END WHERE id = ? AND user_id = ? AND next_invoice_date > ?");
        $stmt->execute([$cycle, $scheduleId, Auth::id(), $cycle]);
    }

    private function advanceBillingSchedule(int $scheduleId): void {
        $db=Database::getConnection();$stmt=$db->prepare('SELECT * FROM recurring_invoices WHERE id = ? AND user_id = ?');$stmt->execute([$scheduleId,Auth::id()]);$schedule=$stmt->fetch(PDO::FETCH_ASSOC);if(!$schedule)return;
        $date=new DateTime($schedule['next_invoice_date']);$day=(int)$date->format('d');
        switch($schedule['frequency']){case'weekly':$date->modify('+1 week');break;case'biweekly':$date->modify('+2 weeks');break;case'quarterly':$date->modify('first day of +3 months');$date->setDate((int)$date->format('Y'),(int)$date->format('m'),min($day,(int)$date->format('t')));break;case'yearly':$month=(int)$date->format('m');$year=(int)$date->format('Y')+1;$date->setDate($year,$month,1);$date->setDate($year,$month,min($day,(int)$date->format('t')));break;default:$date->modify('first day of next month');$date->setDate((int)$date->format('Y'),(int)$date->format('m'),min($day,(int)$date->format('t')));}
        $next=$date->format('Y-m-d');$status=(!empty($schedule['end_date'])&&$next>$schedule['end_date'])?'completed':$schedule['status'];$update=$db->prepare('UPDATE recurring_invoices SET next_invoice_date = ?, last_generated_at = NOW(), total_generated = total_generated + 1, status = ? WHERE id = ? AND user_id = ?');$update->execute([$next,$status,$scheduleId,Auth::id()]);
    }

    private function allowedCategory(string $value): string {
        $allowed = ['general','services','products','freelancer','construction','repair','rental','transport','hospitality','professional','medical','education','recurring','wholesale','creative','automotive'];
        return in_array($value, $allowed, true) ? $value : 'general';
    }

    private function allowedDocumentType(string $value): string {
        $allowed = ['standard_invoice','tax_invoice','pro_forma','commercial','interim','final','recurring','deposit','progress','quote','credit_note','debit_note','receipt'];
        return in_array($value, $allowed, true) ? $value : 'standard_invoice';
    }

    private function cleanSlug(string $value): string {
        return preg_match('/^[a-z0-9-]{1,120}$/', $value) ? $value : 'general-classic';
    }

    private function safeMetadata(mixed $value): array {
        if (!is_array($value)) return [];
        $safe = [];
        foreach (array_slice($value, 0, 40, true) as $key => $item) {
            if (!preg_match('/^[A-Za-z0-9_]{1,50}$/', (string) $key) || (!is_scalar($item) && $item !== null)) continue;
            $safe[(string) $key] = is_string($item) ? mb_substr($item, 0, 500) : $item;
        }
        return $safe;
    }
}
