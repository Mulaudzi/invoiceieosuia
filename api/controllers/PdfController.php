<?php

require_once __DIR__ . '/../lib/FPDF.php';

class InvoicePDF extends FPDF {
    private array $invoice;
    private array $user;
    private array $styles;
    
    public function setData(array $invoice, array $user, array $styles = []): void {
        $this->invoice = $invoice;
        $this->user = $user;
        $this->styles = array_merge([
            'primaryColor' => '#1e3a5f',
            'accentColor' => '#f59e0b',
            'showBorder' => true,
            'tableStyle' => 'striped'
        ], $styles);
    }
    
    private function hexToRgb(string $hex): array {
        $hex = ltrim($hex, '#');
        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2))
        ];
    }
    
    function Header(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        
        // Company header
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->Rect(0, 0, 210, 40, 'F');
        
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Helvetica', 'B', 20);
        $this->SetXY(15, 12);
        $this->Cell(0, 10, $this->user['business_name'] ?? $this->user['name'], 0, 1);
        
        $this->SetFont('Helvetica', '', 10);
        $this->SetXY(15, 24);
        $address = $this->user['address'] ?? '';
        $this->Cell(0, 5, $address, 0, 1);
        
        // Invoice title
        $this->SetTextColor(0, 0, 0);
        $this->SetFont('Helvetica', 'B', 24);
        $this->SetXY(15, 50);
        $this->Cell(0, 10, 'INVOICE', 0, 1);
        
        $this->Ln(5);
    }
    
    function Footer(): void {
        $this->SetY(-25);
        $this->SetFont('Helvetica', '', 8);
        $this->SetTextColor(128, 128, 128);
        $this->Cell(0, 5, 'Thank you for your business!', 0, 1, 'C');
        $this->Cell(0, 5, 'Page ' . $this->PageNo(), 0, 0, 'C');
    }
    
    public function generateInvoice(): void {
        $this->AddPage();
        $this->SetFont('Helvetica', '', 10);
        
        // Invoice details and client info
        $this->SetY(65);
        
        // Left column - Invoice details
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(95, 6, 'Invoice Details', 0, 0);
        $this->Cell(95, 6, 'Bill To', 0, 1);
        
        $this->SetFont('Helvetica', '', 10);
        
        $this->Cell(95, 6, 'Invoice #: ' . $this->invoice['invoice_number'], 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['name'] ?? '', 0, 1);
        
        $this->Cell(95, 6, 'Date: ' . date('d M Y', strtotime($this->invoice['date'])), 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['company'] ?? '', 0, 1);
        
        $this->Cell(95, 6, 'Due: ' . date('d M Y', strtotime($this->invoice['due_date'])), 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['email'] ?? '', 0, 1);
        
        // Status badge
        $accent = $this->hexToRgb($this->styles['accentColor']);
        $this->SetFillColor($accent[0], $accent[1], $accent[2]);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(30, 7, $this->invoice['status'], 0, 0, 'C', true);
        $this->Cell(65, 7, '', 0, 0);
        $this->SetTextColor(0, 0, 0);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(95, 6, $this->invoice['client']['address'] ?? '', 0, 1);
        
        $this->Ln(15);
        
        // Items table
        $this->renderItemsTable();
        
        // Totals
        $this->Ln(10);
        $this->renderTotals();
        
        // Notes
        if (!empty($this->invoice['notes'])) {
            $this->Ln(15);
            $this->SetFont('Helvetica', 'B', 10);
            $this->Cell(0, 6, 'Notes:', 0, 1);
            $this->SetFont('Helvetica', '', 10);
            $this->MultiCell(0, 5, $this->invoice['notes']);
        }
        
        // Terms
        if (!empty($this->invoice['terms'])) {
            $this->Ln(5);
            $this->SetFont('Helvetica', 'B', 10);
            $this->Cell(0, 6, 'Terms & Conditions:', 0, 1);
            $this->SetFont('Helvetica', '', 10);
            $this->MultiCell(0, 5, $this->invoice['terms']);
        }
    }
    
    private function renderItemsTable(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        
        // Table header
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont('Helvetica', 'B', 10);
        
        $this->Cell(80, 8, 'Description', 1, 0, 'L', true);
        $this->Cell(25, 8, 'Qty', 1, 0, 'C', true);
        $this->Cell(30, 8, 'Price', 1, 0, 'R', true);
        $this->Cell(25, 8, 'Tax', 1, 0, 'R', true);
        $this->Cell(30, 8, 'Total', 1, 1, 'R', true);
        
        // Table rows
        $this->SetTextColor(0, 0, 0);
        $this->SetFont('Helvetica', '', 10);
        
        $fill = false;
        $items = $this->invoice['items'] ?? [];
        
        foreach ($items as $item) {
            if ($this->styles['tableStyle'] === 'striped') {
                $this->SetFillColor(245, 245, 245);
            }
            
            $this->Cell(80, 7, $item['name'], 'LR', 0, 'L', $fill && $this->styles['tableStyle'] === 'striped');
            $this->Cell(25, 7, $item['quantity'], 'LR', 0, 'C', $fill && $this->styles['tableStyle'] === 'striped');
            $this->Cell(30, 7, 'R' . number_format($item['price'], 2), 'LR', 0, 'R', $fill && $this->styles['tableStyle'] === 'striped');
            $this->Cell(25, 7, number_format($item['tax_rate'], 1) . '%', 'LR', 0, 'R', $fill && $this->styles['tableStyle'] === 'striped');
            $this->Cell(30, 7, 'R' . number_format($item['total'], 2), 'LR', 1, 'R', $fill && $this->styles['tableStyle'] === 'striped');
            
            $fill = !$fill;
        }
        
        // Close table
        $this->Cell(190, 0, '', 'T');
    }
    
    private function renderTotals(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        
        $this->SetX(120);
        $this->SetFont('Helvetica', '', 10);
        $this->Cell(40, 7, 'Subtotal:', 0, 0, 'R');
        $this->Cell(30, 7, 'R' . number_format($this->invoice['subtotal'], 2), 0, 1, 'R');
        
        $this->SetX(120);
        $this->Cell(40, 7, 'Tax:', 0, 0, 'R');
        $this->Cell(30, 7, 'R' . number_format($this->invoice['tax'], 2), 0, 1, 'R');
        
        $this->SetX(120);
        $this->SetFont('Helvetica', 'B', 12);
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->SetTextColor(255, 255, 255);
        $this->Cell(40, 9, 'Total:', 1, 0, 'R', true);
        $this->Cell(30, 9, 'R' . number_format($this->invoice['total'], 2), 1, 1, 'R', true);
        
        // Balance due
        if (isset($this->invoice['balance_due']) && $this->invoice['balance_due'] > 0) {
            $this->SetTextColor(0, 0, 0);
            $this->SetX(120);
            $this->SetFont('Helvetica', 'B', 11);
            $this->Cell(40, 8, 'Balance Due:', 0, 0, 'R');
            $this->SetTextColor(200, 0, 0);
            $this->Cell(30, 8, 'R' . number_format($this->invoice['balance_due'], 2), 0, 1, 'R');
        }
    }
}

class PdfController {
    public function generate(array $params): void {
        $invoiceId = (int) $params['id'];
        
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->withRelations($invoice);
        
        $user = Auth::user();
        
        // Get template styles
        $styles = [];
        if (!empty($invoice['template_id'])) {
            $templateModel = new Template();
            $template = $templateModel->findWithParsedStyles($invoice['template_id']);
            if ($template) {
                $styles = $template['styles'] ?? [];
            }
        }
        
        // Generate PDF
        $pdf = new InvoicePDF();
        $pdf->setData($invoice, $user, $styles);
        $pdf->generateInvoice();
        
        // Output
        $filename = 'invoice-' . $invoice['invoice_number'] . '.pdf';
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: private, max-age=0, must-revalidate');
        
        echo $pdf->Output('S');
        exit;
    }
    
    public function preview(array $params): void {
        $invoiceId = (int) $params['id'];
        
        $invoice = Invoice::query()->find($invoiceId);
        if (!$invoice || $invoice['user_id'] !== Auth::id()) {
            Response::error('Invoice not found', 404);
        }
        
        $invoiceModel = new Invoice();
        $invoice = $invoiceModel->withRelations($invoice);
        
        $user = Auth::user();
        
        // Get template styles
        $styles = [];
        if (!empty($invoice['template_id'])) {
            $templateModel = new Template();
            $template = $templateModel->findWithParsedStyles($invoice['template_id']);
            if ($template) {
                $styles = $template['styles'] ?? [];
            }
        }
        
        // Generate PDF
        $pdf = new InvoicePDF();
        $pdf->setData($invoice, $user, $styles);
        $pdf->generateInvoice();
        
        // Output inline (preview)
        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="preview.pdf"');
        
        echo $pdf->Output('S');
        exit;
    }
}
