<?php

class RecurringInvoiceController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getConnection();
    }
    
    public function getAll() {
        $userId = Auth::id() ?? Auth::getUserId();
        
        $stmt = $this->db->prepare("
            SELECT 
                ri.*,
                c.name as client_name,
                c.email as client_email
            FROM recurring_invoices ri
            JOIN clients c ON ri.client_id = c.id
            WHERE ri.user_id = ?
            ORDER BY ri.created_at DESC
        ");
        $stmt->execute([$userId]);
        $recurringInvoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get items for each recurring invoice
        foreach ($recurringInvoices as &$ri) {
            $itemStmt = $this->db->prepare("
                SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = ?
            ");
            $itemStmt->execute([$ri['id']]);
            $ri['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            $ri['generated_invoices'] = $this->generatedInvoices((int) $ri['id'], $userId);
        }
        
        Response::json(['data' => $recurringInvoices]);
    }
    
    public function getById(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $userId = Auth::id() ?? Auth::getUserId();
        
        $stmt = $this->db->prepare("
            SELECT 
                ri.*,
                c.name as client_name,
                c.email as client_email
            FROM recurring_invoices ri
            JOIN clients c ON ri.client_id = c.id
            WHERE ri.id = ? AND ri.user_id = ?
        ");
        $stmt->execute([$id, $userId]);
        $recurringInvoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$recurringInvoice) {
            Response::error('Recurring invoice not found', 404);
            return;
        }
        
        // Get items
        $itemStmt = $this->db->prepare("
            SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = ?
        ");
        $itemStmt->execute([$id]);
        $recurringInvoice['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $recurringInvoice['generated_invoices'] = $this->generatedInvoices($id, $userId);
        
        Response::json(['data' => $recurringInvoice]);
    }
    
    public function create() {
        $userId = Auth::id() ?? Auth::getUserId();
        $request = new Request();
        $data = $request->all() ?? [];
        
        if (empty($data['client_id']) || empty($data['description']) || empty($data['frequency']) || empty($data['start_date'])) {
            Response::error('Missing required fields', 400);
            return;
        }
        
        if (empty($data['items']) || !is_array($data['items'])) {
            Response::error('At least one line item is required', 400);
            return;
        }

        if (!$this->referencesBelongToUser($data, $userId)) {
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Calculate totals
            $subtotal = 0;
            $tax = 0;
            foreach ($data['items'] as $item) {
                $itemSubtotal = (float) $item['quantity'] * (float) $item['unit_price'];
                $subtotal += $itemSubtotal;
                $tax += $itemSubtotal * min(100, max(0, (float) ($item['tax_rate'] ?? 0))) / 100;
            }
            $total = $subtotal + $tax;
            
            // Calculate next invoice date
            $nextInvoiceDate = $data['start_date'];
            
            $stmt = $this->db->prepare("
                INSERT INTO recurring_invoices 
                (user_id, client_id, template_id, description, frequency, start_date, end_date, 
                 next_invoice_date, subtotal, tax, total, notes, terms, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            ");
            
            $stmt->execute([
                $userId,
                $data['client_id'],
                $data['template_id'] ?? null,
                $data['description'],
                $data['frequency'],
                $data['start_date'],
                $data['end_date'] ?? null,
                $nextInvoiceDate,
                $subtotal,
                $tax,
                $total,
                $data['notes'] ?? null,
                $data['terms'] ?? null
            ]);
            
            $recurringId = $this->db->lastInsertId();
            
            // Insert items
            $hasItemTaxRate = $this->columnExists('recurring_invoice_items', 'tax_rate');
            $itemStmt = $this->db->prepare($hasItemTaxRate
                ? "INSERT INTO recurring_invoice_items (recurring_invoice_id, product_id, description, quantity, unit_price, tax_rate, total) VALUES (?, ?, ?, ?, ?, ?, ?)"
                : "INSERT INTO recurring_invoice_items (recurring_invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)");
            
            foreach ($data['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $values = [
                    $recurringId,
                    $item['product_id'] ?? null,
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price']
                ];
                if ($hasItemTaxRate) $values[] = min(100, max(0, (float) ($item['tax_rate'] ?? 0)));
                $values[] = $itemTotal;
                $itemStmt->execute($values);
            }
            
            $this->db->commit();
            
            Response::json([
                'message' => 'Recurring invoice created successfully',
                'id' => $recurringId
            ], 201);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to create recurring invoice: ' . $e->getMessage(), 500);
        }
    }
    
    public function update(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $userId = Auth::id() ?? Auth::getUserId();
        $request = new Request();
        $data = $request->all() ?? [];
        
        // Verify ownership
        $stmt = $this->db->prepare("SELECT id FROM recurring_invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Recurring invoice not found', 404);
            return;
        }


        if (!$this->referencesBelongToUser($data, $userId)) {
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Calculate totals if items provided
            if (!empty($data['items'])) {
                $subtotal = 0;
                $tax = 0;
                foreach ($data['items'] as $item) {
                    $itemSubtotal = (float) $item['quantity'] * (float) $item['unit_price'];
                    $subtotal += $itemSubtotal;
                    $tax += $itemSubtotal * min(100, max(0, (float) ($item['tax_rate'] ?? 0))) / 100;
                }
                $total = $subtotal + $tax;
                
                $data['subtotal'] = $subtotal;
                $data['tax'] = $tax;
                $data['total'] = $total;
            }
            
            // Build update query
            $updateFields = [];
            $params = [];
            
            $allowedFields = ['client_id', 'template_id', 'description', 'frequency', 
                             'start_date', 'end_date', 'notes', 'terms', 'subtotal', 'tax', 'total'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($updateFields)) {
                $params[] = $id;
                $sql = "UPDATE recurring_invoices SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
            }
            
            // Update items if provided
            if (!empty($data['items'])) {
                // Delete existing items
                $deleteStmt = $this->db->prepare("DELETE FROM recurring_invoice_items WHERE recurring_invoice_id = ?");
                $deleteStmt->execute([$id]);
                
                // Insert new items
                $hasItemTaxRate = $this->columnExists('recurring_invoice_items', 'tax_rate');
                $itemStmt = $this->db->prepare($hasItemTaxRate
                    ? "INSERT INTO recurring_invoice_items (recurring_invoice_id, product_id, description, quantity, unit_price, tax_rate, total) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    : "INSERT INTO recurring_invoice_items (recurring_invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)");
                
                foreach ($data['items'] as $item) {
                    $itemTotal = $item['quantity'] * $item['unit_price'];
                    $values = [
                        $id,
                        $item['product_id'] ?? null,
                        $item['description'],
                        $item['quantity'],
                        $item['unit_price']
                    ];
                    if ($hasItemTaxRate) $values[] = min(100, max(0, (float) ($item['tax_rate'] ?? 0)));
                    $values[] = $itemTotal;
                    $itemStmt->execute($values);
                }
            }
            
            $this->db->commit();
            
            Response::json(['message' => 'Recurring invoice updated successfully']);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to update recurring invoice: ' . $e->getMessage(), 500);
        }
    }
    
    public function delete(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $userId = Auth::id() ?? Auth::getUserId();
        
        $stmt = $this->db->prepare("DELETE FROM recurring_invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Recurring invoice not found', 404);
            return;
        }
        
        Response::json(['message' => 'Recurring invoice deleted successfully']);
    }
    
    public function updateStatus(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $userId = Auth::id() ?? Auth::getUserId();
        $request = new Request();
        $data = $request->all() ?? [];
        
        if (empty($data['status'])) {
            Response::error('Status is required', 400);
            return;
        }
        
        $validStatuses = ['active', 'paused', 'completed', 'cancelled'];
        if (!in_array($data['status'], $validStatuses)) {
            Response::error('Invalid status', 400);
            return;
        }
        
        $stmt = $this->db->prepare("
            UPDATE recurring_invoices 
            SET status = ? 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$data['status'], $id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Recurring invoice not found', 404);
            return;
        }
        
        Response::json(['message' => 'Status updated successfully']);
    }
    
    public function generate(array $params): void {
        $id = (int) ($params['id'] ?? 0);
        $userId = Auth::id() ?? Auth::getUserId();
        
        // Get recurring invoice
        $stmt = $this->db->prepare("
            SELECT ri.*, c.name as client_name, c.email as client_email
            FROM recurring_invoices ri
            JOIN clients c ON ri.client_id = c.id
            WHERE ri.id = ? AND ri.user_id = ? AND ri.status = 'active'
        ");
        $stmt->execute([$id, $userId]);
        $recurring = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$recurring) {
            Response::error('Recurring invoice not found or not active', 404);
            return;
        }
        
        try {
            $generated = $this->generateInvoice($recurring);
            
            Response::json([
                'message' => 'Invoice generated successfully',
                'invoice_id' => $generated['invoice_id'],
                'invoice_number' => $generated['invoice_number']
            ], 201);
            
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            Response::error('Failed to generate invoice: ' . $e->getMessage(), 500);
        }
    }
    
    private function calculateNextDate($currentDate, $frequency) {
        $date = new DateTime($currentDate);
        $billingDay = (int) $date->format('d');
        
        switch ($frequency) {
            case 'weekly':
                $date->modify('+1 week');
                break;
            case 'biweekly':
                $date->modify('+2 weeks');
                break;
            case 'monthly':
                $date->modify('first day of next month');
                $date->setDate((int) $date->format('Y'), (int) $date->format('m'), min($billingDay, (int) $date->format('t')));
                break;
            case 'quarterly':
                $date->modify('first day of +3 months');
                $date->setDate((int) $date->format('Y'), (int) $date->format('m'), min($billingDay, (int) $date->format('t')));
                break;
            case 'yearly':
                $month = (int) $date->format('m');
                $year = (int) $date->format('Y') + 1;
                $date->setDate($year, $month, 1);
                $date->setDate($year, $month, min($billingDay, (int) $date->format('t')));
                break;
        }
        
        return $date->format('Y-m-d');
    }
    
    // Cron job to process due recurring invoices
    public function processDue() {
        $result = $this->processDueSchedules(null);
        Response::json([
            'message' => 'Processed recurring invoices',
            'generated' => $result['generated'],
            'errors' => $result['errors']
        ]);
    }

    private function processDueSchedules(?int $userId): array {
        $userFilter = $userId !== null ? ' AND ri.user_id = ?' : '';
        $stmt = $this->db->prepare("
            SELECT ri.*
            FROM recurring_invoices ri
            WHERE ri.status = 'active' 
            AND ri.next_invoice_date <= CURDATE()
            AND (ri.end_date IS NULL OR ri.next_invoice_date <= ri.end_date)
            {$userFilter}
        ");
        $stmt->execute($userId !== null ? [$userId] : []);
        $dueInvoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $generated = 0;
        $errors = [];
        
        foreach ($dueInvoices as $recurring) {
            // Generate every missed billing period, with a defensive cap for
            // malformed historical schedules.
            for ($periods = 0; $periods < 120 && $recurring['next_invoice_date'] <= date('Y-m-d'); $periods++) {
                if ($recurring['end_date'] && $recurring['next_invoice_date'] > $recurring['end_date']) break;
                try {
                    $scheduledDate = $recurring['next_invoice_date'];
                    $this->generateInvoice($recurring, $scheduledDate);
                    $generated++;
                    $recurring['next_invoice_date'] = $this->calculateNextDate($scheduledDate, $recurring['frequency']);
                } catch (Throwable $e) {
                    $errors[] = ['id' => $recurring['id'], 'error' => $e->getMessage()];
                    break;
                }
            }
        }
        return ['generated' => $generated, 'errors' => $errors];
    }

    private function referencesBelongToUser(array $data, int $userId): bool {
        $checks = [
            ['field' => 'client_id', 'table' => 'clients', 'required' => true],
            ['field' => 'template_id', 'table' => 'templates', 'required' => false],
        ];

        foreach ($checks as $check) {
            $value = $data[$check['field']] ?? null;
            if ($value === null || $value === '') {
                if ($check['required'] && array_key_exists($check['field'], $data)) {
                    Response::error('Referenced record not found', 404);
                    return false;
                }
                continue;
            }
            $stmt = $this->db->prepare("SELECT id FROM {$check['table']} WHERE id = ? AND user_id = ?");
            $stmt->execute([(int) $value, $userId]);
            if (!$stmt->fetchColumn()) {
                Response::error('Referenced record not found', 404);
                return false;
            }
        }

        foreach (($data['items'] ?? []) as $item) {
            if (empty($item['product_id'])) {
                continue;
            }
            $stmt = $this->db->prepare('SELECT id FROM products WHERE id = ? AND user_id = ?');
            $stmt->execute([(int) $item['product_id'], $userId]);
            if (!$stmt->fetchColumn()) {
                Response::error('Referenced product not found', 404);
                return false;
            }
        }
        return true;
    }

    private function columnExists(string $table, string $column): bool {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?');
        $stmt->execute([$table, $column]);
        return (int) $stmt->fetchColumn() > 0;
    }

    private function generatedInvoices(int $recurringId, int $userId): array {
        if (!$this->columnExists('invoices', 'recurring_invoice_id')) return [];
        $stmt = $this->db->prepare('SELECT id, invoice_number, date, due_date, status, total, metadata FROM invoices WHERE recurring_invoice_id = ? AND user_id = ? ORDER BY date DESC, id DESC');
        $stmt->execute([$recurringId, $userId]);
        $rows=$stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($rows as &$row){$metadata=json_decode((string)($row['metadata']??''),true)?:[];$history=is_array($metadata['payment_history']??null)?$metadata['payment_history']:[];$paid=array_reduce($history,fn($sum,$payment)=>$sum+max(0,(float)($payment['amount']??0)),0.0);if($row['status']==='Paid'&&$paid<=0)$paid=(float)$row['total'];$row['payment_date']=$metadata['payment_date']??null;$row['payment_history']=$history;$row['amount_paid']=min((float)$row['total'],$paid);$row['balance_due']=max(0,(float)$row['total']-$row['amount_paid']);unset($row['metadata']);}
        return $rows;
    }

    private function generateInvoice(array $recurring, ?string $scheduledDate = null): array {
        $id = (int) $recurring['id'];
        $itemStmt = $this->db->prepare('SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = ?');
        $itemStmt->execute([$id]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $this->db->beginTransaction();
        try {
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . bin2hex(random_bytes(3));
            $profile = User::query()->find((int) $recurring['user_id']);
            $profileSnapshot = [
                'business_name'=>$profile['business_name'] ?? $profile['name'] ?? '', 'business_address'=>$profile['address'] ?? '',
                'business_email'=>$profile['email'] ?? '', 'business_phone'=>$profile['phone'] ?? '',
                'business_tax_number'=>$profile['tax_number'] ?? '', 'business_registration_number'=>$profile['registration_number'] ?? '',
                'business_website'=>$profile['website'] ?? '', 'invoice_logo_path'=>$profile['logo_path'] ?? '',
                'bank_name'=>$profile['bank_name'] ?? '', 'account_name'=>$profile['account_name'] ?? '',
                'account_number'=>$profile['account_number'] ?? '', 'branch_code'=>$profile['branch_code'] ?? '',
                'swift_code'=>$profile['swift_code'] ?? '', 'payment_instructions'=>$profile['payment_instructions'] ?? '',
            ];
            $invoiceDate = $scheduledDate ?: date('Y-m-d');
            $invoiceStmt = $this->db->prepare("
                INSERT INTO invoices
                (user_id, client_id, template_id, recurring_invoice_id, invoice_number,
                 date, due_date, subtotal, tax, total, notes, terms, metadata, status)
                VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), ?, ?, ?, ?, ?, ?, 'Pending')
            ");
            $invoiceStmt->execute([
                $recurring['user_id'], $recurring['client_id'], $recurring['template_id'], $id,
                $invoiceNumber, $invoiceDate, $invoiceDate, $recurring['subtotal'], $recurring['tax'], $recurring['total'],
                $recurring['notes'], $recurring['terms'], json_encode($profileSnapshot)
            ]);
            $invoiceId = (int) $this->db->lastInsertId();

            $invoiceItemStmt = $this->db->prepare("
                INSERT INTO invoice_items
                (invoice_id, product_id, name, description, quantity, price, tax_rate, subtotal, tax, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($items as $item) {
                $subtotal = (float) $item['total'];
                $taxRate = min(100, max(0, (float) ($item['tax_rate'] ?? 0)));
                $tax = $subtotal * $taxRate / 100;
                $invoiceItemStmt->execute([
                    $invoiceId, $item['product_id'], $item['description'], $item['description'],
                    $item['quantity'], $item['unit_price'], $taxRate, $subtotal, $tax, $subtotal + $tax
                ]);
            }

            $nextDate = $this->calculateNextDate($recurring['next_invoice_date'], $recurring['frequency']);
            $status = ($recurring['end_date'] && $nextDate > $recurring['end_date']) ? 'completed' : $recurring['status'];
            $updateStmt = $this->db->prepare("
                UPDATE recurring_invoices
                SET next_invoice_date = ?, last_generated_at = NOW(), total_generated = total_generated + 1, status = ?
                WHERE id = ?
            ");
            $updateStmt->execute([$nextDate, $status, $id]);
            $this->db->commit();
            return ['invoice_id' => $invoiceId, 'invoice_number' => $invoiceNumber];
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}
