<?php

class RecurringInvoiceController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function getAll() {
        $userId = Auth::getUserId();
        
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
        }
        
        Response::json(['data' => $recurringInvoices]);
    }
    
    public function getById($id) {
        $userId = Auth::getUserId();
        
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
        
        Response::json(['data' => $recurringInvoice]);
    }
    
    public function create() {
        $userId = Auth::getUserId();
        $data = Request::getBody();
        
        if (empty($data['client_id']) || empty($data['description']) || empty($data['frequency']) || empty($data['start_date'])) {
            Response::error('Missing required fields', 400);
            return;
        }
        
        if (empty($data['items']) || !is_array($data['items'])) {
            Response::error('At least one line item is required', 400);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Calculate totals
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }
            $tax = $subtotal * 0.15; // 15% VAT
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
            $itemStmt = $this->db->prepare("
                INSERT INTO recurring_invoice_items 
                (recurring_invoice_id, product_id, description, quantity, unit_price, total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($data['items'] as $item) {
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $itemStmt->execute([
                    $recurringId,
                    $item['product_id'] ?? null,
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $itemTotal
                ]);
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
    
    public function update($id) {
        $userId = Auth::getUserId();
        $data = Request::getBody();
        
        // Verify ownership
        $stmt = $this->db->prepare("SELECT id FROM recurring_invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Recurring invoice not found', 404);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Calculate totals if items provided
            if (!empty($data['items'])) {
                $subtotal = 0;
                foreach ($data['items'] as $item) {
                    $subtotal += $item['quantity'] * $item['unit_price'];
                }
                $tax = $subtotal * 0.15;
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
                $itemStmt = $this->db->prepare("
                    INSERT INTO recurring_invoice_items 
                    (recurring_invoice_id, product_id, description, quantity, unit_price, total)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                
                foreach ($data['items'] as $item) {
                    $itemTotal = $item['quantity'] * $item['unit_price'];
                    $itemStmt->execute([
                        $id,
                        $item['product_id'] ?? null,
                        $item['description'],
                        $item['quantity'],
                        $item['unit_price'],
                        $itemTotal
                    ]);
                }
            }
            
            $this->db->commit();
            
            Response::json(['message' => 'Recurring invoice updated successfully']);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to update recurring invoice: ' . $e->getMessage(), 500);
        }
    }
    
    public function delete($id) {
        $userId = Auth::getUserId();
        
        $stmt = $this->db->prepare("DELETE FROM recurring_invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Recurring invoice not found', 404);
            return;
        }
        
        Response::json(['message' => 'Recurring invoice deleted successfully']);
    }
    
    public function updateStatus($id) {
        $userId = Auth::getUserId();
        $data = Request::getBody();
        
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
    
    public function generate($id) {
        $userId = Auth::getUserId();
        
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
        
        // Get items
        $itemStmt = $this->db->prepare("SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = ?");
        $itemStmt->execute([$id]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        
        try {
            $this->db->beginTransaction();
            
            // Generate invoice number
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Create invoice
            $invoiceStmt = $this->db->prepare("
                INSERT INTO invoices 
                (user_id, client_id, template_id, recurring_invoice_id, invoice_number, 
                 date, due_date, subtotal, tax, total, notes, terms, status)
                VALUES (?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, ?, ?, ?, ?, 'Pending')
            ");
            
            $invoiceStmt->execute([
                $userId,
                $recurring['client_id'],
                $recurring['template_id'],
                $id,
                $invoiceNumber,
                $recurring['subtotal'],
                $recurring['tax'],
                $recurring['total'],
                $recurring['notes'],
                $recurring['terms']
            ]);
            
            $invoiceId = $this->db->lastInsertId();
            
            // Create invoice items
            $invoiceItemStmt = $this->db->prepare("
                INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($items as $item) {
                $invoiceItemStmt->execute([
                    $invoiceId,
                    $item['product_id'],
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['total']
                ]);
            }
            
            // Update recurring invoice
            $nextDate = $this->calculateNextDate($recurring['next_invoice_date'], $recurring['frequency']);
            
            $updateStmt = $this->db->prepare("
                UPDATE recurring_invoices 
                SET next_invoice_date = ?, 
                    last_generated_at = NOW(), 
                    total_generated = total_generated + 1
                WHERE id = ?
            ");
            $updateStmt->execute([$nextDate, $id]);
            
            // Check if completed
            if ($recurring['end_date'] && $nextDate > $recurring['end_date']) {
                $completeStmt = $this->db->prepare("UPDATE recurring_invoices SET status = 'completed' WHERE id = ?");
                $completeStmt->execute([$id]);
            }
            
            $this->db->commit();
            
            Response::json([
                'message' => 'Invoice generated successfully',
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoiceNumber
            ], 201);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Failed to generate invoice: ' . $e->getMessage(), 500);
        }
    }
    
    private function calculateNextDate($currentDate, $frequency) {
        $date = new DateTime($currentDate);
        
        switch ($frequency) {
            case 'weekly':
                $date->modify('+1 week');
                break;
            case 'biweekly':
                $date->modify('+2 weeks');
                break;
            case 'monthly':
                $date->modify('+1 month');
                break;
            case 'quarterly':
                $date->modify('+3 months');
                break;
            case 'yearly':
                $date->modify('+1 year');
                break;
        }
        
        return $date->format('Y-m-d');
    }
    
    // Cron job to process due recurring invoices
    public function processDue() {
        $stmt = $this->db->prepare("
            SELECT ri.*, u.email as user_email
            FROM recurring_invoices ri
            JOIN users u ON ri.user_id = u.id
            WHERE ri.status = 'active' 
            AND ri.next_invoice_date <= CURDATE()
            AND (ri.end_date IS NULL OR ri.next_invoice_date <= ri.end_date)
        ");
        $stmt->execute();
        $dueInvoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $generated = 0;
        $errors = [];
        
        foreach ($dueInvoices as $recurring) {
            try {
                // Temporarily set user context
                Auth::setUserId($recurring['user_id']);
                $this->generate($recurring['id']);
                $generated++;
            } catch (Exception $e) {
                $errors[] = [
                    'id' => $recurring['id'],
                    'error' => $e->getMessage()
                ];
            }
        }
        
        Response::json([
            'message' => 'Processed recurring invoices',
            'generated' => $generated,
            'errors' => $errors
        ]);
    }
}