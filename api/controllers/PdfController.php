<?php

require_once __DIR__ . '/../lib/FPDF.php';

class InvoicePDF extends FPDF {
    private array $invoice;
    private array $user;
    private array $styles;
    private string $currencySymbol = 'R';
    
    public function setData(array $invoice, array $user, array $styles = []): void {
        $this->invoice = $invoice;
        $this->user = $user;
        $this->styles = array_merge([
            'primaryColor' => '#1e3a5f',
            'accentColor' => '#f59e0b',
            'fontFamily' => 'inter',
            'headerStyle' => 'left',
            'showLogo' => true,
            'showBorder' => true,
            'showWatermark' => false,
            'tableStyle' => 'striped',
        ], $styles);
        
        // Set currency symbol based on invoice currency
        $currencySymbols = [
            'ZAR' => 'R',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'AUD' => 'A$',
            'CAD' => 'C$',
            'INR' => '₹',
            'NGN' => '₦',
            'KES' => 'KSh',
            'BWP' => 'P',
            'NAD' => 'N$',
        ];
        $currency = $invoice['currency'] ?? 'ZAR';
        $this->currencySymbol = $currencySymbols[$currency] ?? $currency;
    }
    
    private function hexToRgb(string $hex): array {
        $hex = ltrim($hex, '#');
        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2))
        ];
    }
    
    private function getFont(): string {
        // FPDF only supports core fonts, but we can map to closest
        $fontMap = [
            'inter' => 'Helvetica',
            'poppins' => 'Helvetica',
            'roboto' => 'Helvetica',
            'opensans' => 'Helvetica',
            'lato' => 'Helvetica',
        ];
        return $fontMap[$this->styles['fontFamily']] ?? 'Helvetica';
    }
    
    function Header(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $accent = $this->hexToRgb($this->styles['accentColor']);
        $font = $this->getFont();
        $headerStyle = $this->styles['headerStyle'] ?? 'left';
        
        // Watermark (if enabled)
        if ($this->styles['showWatermark']) {
            $this->SetFont($font, 'B', 60);
            $this->SetTextColor(240, 240, 240);
            $this->RotatedText(30, 180, 'SAMPLE', 45);
        }
        
        // Header background
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->Rect(0, 0, 210, 45, 'F');
        
        // Border accent line
        if ($this->styles['showBorder']) {
            $this->SetFillColor($accent[0], $accent[1], $accent[2]);
            $this->Rect(0, 45, 210, 3, 'F');
        }
        
        // Company header based on alignment
        $this->SetTextColor(255, 255, 255);
        $businessName = $this->user['business_name'] ?? $this->user['name'];
        
        if ($headerStyle === 'center') {
            // Centered header
            if ($this->styles['showLogo'] && !empty($this->user['logo_path'])) {
                // Logo would go here if we had it
            }
            $this->SetFont($font, 'B', 22);
            $this->SetXY(15, 12);
            $this->Cell(180, 10, $businessName, 0, 1, 'C');
            
            $this->SetFont($font, '', 10);
            $this->SetXY(15, 24);
            $address = $this->user['address'] ?? '';
            $this->Cell(180, 5, $address, 0, 1, 'C');
            
            if (!empty($this->user['phone'])) {
                $this->SetXY(15, 31);
                $this->Cell(180, 5, $this->user['phone'], 0, 1, 'C');
            }
        } elseif ($headerStyle === 'right') {
            // Right-aligned header
            $this->SetFont($font, 'B', 22);
            $this->SetXY(15, 12);
            $this->Cell(180, 10, $businessName, 0, 1, 'R');
            
            $this->SetFont($font, '', 10);
            $this->SetXY(15, 24);
            $address = $this->user['address'] ?? '';
            $this->Cell(180, 5, $address, 0, 1, 'R');
            
            if (!empty($this->user['phone'])) {
                $this->SetXY(15, 31);
                $this->Cell(180, 5, $this->user['phone'], 0, 1, 'R');
            }
        } else {
            // Left-aligned header (default)
            $this->SetFont($font, 'B', 22);
            $this->SetXY(15, 12);
            $this->Cell(0, 10, $businessName, 0, 1);
            
            $this->SetFont($font, '', 10);
            $this->SetXY(15, 24);
            $address = $this->user['address'] ?? '';
            $this->Cell(0, 5, $address, 0, 1);
            
            if (!empty($this->user['phone'])) {
                $this->SetXY(15, 31);
                $this->Cell(0, 5, $this->user['phone'], 0, 1);
            }
        }
        
        // Invoice title with accent color
        $this->SetTextColor($primary[0], $primary[1], $primary[2]);
        $this->SetFont($font, 'B', 28);
        $this->SetXY(15, 55);
        $this->Cell(0, 10, 'INVOICE', 0, 1);
        
        $this->Ln(5);
    }
    
    function Footer(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $font = $this->getFont();
        
        // Footer line
        $this->SetY(-30);
        $this->SetDrawColor($primary[0], $primary[1], $primary[2]);
        $this->Line(15, $this->GetY(), 195, $this->GetY());
        
        $this->SetY(-25);
        $this->SetFont($font, '', 8);
        $this->SetTextColor(128, 128, 128);
        $this->Cell(0, 5, 'Thank you for your business!', 0, 1, 'C');
        $this->Cell(0, 5, 'Page ' . $this->PageNo() . ' | Generated on ' . date('d M Y'), 0, 0, 'C');
    }
    
    public function generateInvoice(): void {
        $this->AddPage();
        $font = $this->getFont();
        $this->SetFont($font, '', 10);
        
        // Invoice details and client info
        $this->SetY(72);
        
        // Two-column layout
        $this->SetFont($font, 'B', 11);
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $this->SetTextColor($primary[0], $primary[1], $primary[2]);
        $this->Cell(95, 7, 'Invoice Details', 0, 0);
        $this->Cell(95, 7, 'Bill To', 0, 1);
        
        $this->SetTextColor(0, 0, 0);
        $this->SetFont($font, '', 10);
        
        $this->Cell(95, 6, 'Invoice #: ' . $this->invoice['invoice_number'], 0, 0);
        $this->SetFont($font, 'B', 10);
        $this->Cell(95, 6, $this->invoice['client']['name'] ?? '', 0, 1);
        
        $this->SetFont($font, '', 10);
        $this->Cell(95, 6, 'Date: ' . date('d M Y', strtotime($this->invoice['date'])), 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['company'] ?? '', 0, 1);
        
        $this->Cell(95, 6, 'Due: ' . date('d M Y', strtotime($this->invoice['due_date'])), 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['email'] ?? '', 0, 1);
        
        // Currency (if not ZAR)
        $currency = $this->invoice['currency'] ?? 'ZAR';
        if ($currency !== 'ZAR') {
            $this->Cell(95, 6, 'Currency: ' . $currency, 0, 0);
        } else {
            $this->Cell(95, 6, '', 0, 0);
        }
        $this->Cell(95, 6, $this->invoice['client']['phone'] ?? '', 0, 1);
        
        // Status badge
        $accent = $this->hexToRgb($this->styles['accentColor']);
        $status = $this->invoice['status'];
        
        // Status colors
        $statusColors = [
            'Paid' => [16, 185, 129], // Green
            'Pending' => [245, 158, 11], // Yellow/Orange
            'Overdue' => [239, 68, 68], // Red
            'Draft' => [156, 163, 175], // Gray
        ];
        $statusColor = $statusColors[$status] ?? $accent;
        
        $this->SetFillColor($statusColor[0], $statusColor[1], $statusColor[2]);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont($font, 'B', 9);
        $this->Cell(30, 7, $status, 0, 0, 'C', true);
        $this->Cell(65, 7, '', 0, 0);
        $this->SetTextColor(0, 0, 0);
        $this->SetFont($font, '', 10);
        $clientAddress = $this->invoice['client']['address'] ?? '';
        $this->Cell(95, 6, $clientAddress, 0, 1);
        
        $this->Ln(15);
        
        // Items table
        $this->renderItemsTable();
        
        // Totals
        $this->Ln(10);
        $this->renderTotals();
        
        // Notes
        if (!empty($this->invoice['notes'])) {
            $this->Ln(15);
            $this->SetFont($font, 'B', 10);
            $this->SetTextColor($primary[0], $primary[1], $primary[2]);
            $this->Cell(0, 6, 'Notes:', 0, 1);
            $this->SetTextColor(0, 0, 0);
            $this->SetFont($font, '', 10);
            $this->MultiCell(0, 5, $this->invoice['notes']);
        }
        
        // Terms
        if (!empty($this->invoice['terms'])) {
            $this->Ln(5);
            $this->SetFont($font, 'B', 10);
            $this->SetTextColor($primary[0], $primary[1], $primary[2]);
            $this->Cell(0, 6, 'Terms & Conditions:', 0, 1);
            $this->SetTextColor(0, 0, 0);
            $this->SetFont($font, '', 10);
            $this->MultiCell(0, 5, $this->invoice['terms']);
        }
        
        // Payment info
        $this->Ln(10);
        $this->SetFont($font, 'B', 10);
        $this->SetTextColor($primary[0], $primary[1], $primary[2]);
        $this->Cell(0, 6, 'Payment Information:', 0, 1);
        $this->SetTextColor(100, 100, 100);
        $this->SetFont($font, '', 9);
        $this->Cell(0, 5, 'Please include the invoice number in your payment reference.', 0, 1);
    }
    
    private function renderItemsTable(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $font = $this->getFont();
        $tableStyle = $this->styles['tableStyle'] ?? 'striped';
        
        // Table header
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->SetTextColor(255, 255, 255);
        $this->SetFont($font, 'B', 10);
        
        $border = $tableStyle === 'bordered' ? 1 : 0;
        
        $this->Cell(75, 9, '  Description', $border, 0, 'L', true);
        $this->Cell(25, 9, 'Qty', $border, 0, 'C', true);
        $this->Cell(30, 9, 'Price', $border, 0, 'R', true);
        $this->Cell(25, 9, 'Tax', $border, 0, 'R', true);
        $this->Cell(35, 9, 'Total', $border, 1, 'R', true);
        
        // Table rows
        $this->SetTextColor(0, 0, 0);
        $this->SetFont($font, '', 10);
        
        $fill = false;
        $items = $this->invoice['items'] ?? [];
        
        foreach ($items as $item) {
            // Striped background
            if ($tableStyle === 'striped' && $fill) {
                $this->SetFillColor(248, 248, 248);
            } else {
                $this->SetFillColor(255, 255, 255);
            }
            
            $rowBorder = $tableStyle === 'bordered' ? 'LR' : 0;
            $useFill = ($tableStyle === 'striped' && $fill) || $tableStyle === 'bordered';
            
            $this->Cell(75, 8, '  ' . $item['name'], $rowBorder, 0, 'L', $useFill);
            $this->Cell(25, 8, $item['quantity'], $rowBorder, 0, 'C', $useFill);
            $this->Cell(30, 8, $this->currencySymbol . number_format($item['price'], 2), $rowBorder, 0, 'R', $useFill);
            $this->Cell(25, 8, number_format($item['tax_rate'], 1) . '%', $rowBorder, 0, 'R', $useFill);
            $this->Cell(35, 8, $this->currencySymbol . number_format($item['total'], 2), $rowBorder, 1, 'R', $useFill);
            
            $fill = !$fill;
        }
        
        // Close table
        if ($tableStyle !== 'minimal') {
            $this->SetDrawColor($primary[0], $primary[1], $primary[2]);
            $this->Cell(190, 0, '', 'T');
        }
    }
    
    private function renderTotals(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $font = $this->getFont();
        
        $this->SetX(120);
        $this->SetFont($font, '', 10);
        $this->Cell(40, 8, 'Subtotal:', 0, 0, 'R');
        $this->Cell(30, 8, $this->currencySymbol . number_format($this->invoice['subtotal'], 2), 0, 1, 'R');
        
        $this->SetX(120);
        $this->Cell(40, 8, 'Tax:', 0, 0, 'R');
        $this->Cell(30, 8, $this->currencySymbol . number_format($this->invoice['tax'], 2), 0, 1, 'R');
        
        // Total with primary color background
        $this->SetX(120);
        $this->SetFont($font, 'B', 12);
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->SetTextColor(255, 255, 255);
        $this->Cell(40, 10, 'Total:', 1, 0, 'R', true);
        $this->Cell(30, 10, $this->currencySymbol . number_format($this->invoice['total'], 2), 1, 1, 'R', true);
        
        // Balance due (if applicable)
        if (isset($this->invoice['balance_due']) && $this->invoice['balance_due'] > 0 && $this->invoice['balance_due'] < $this->invoice['total']) {
            $this->SetTextColor(0, 0, 0);
            $this->SetX(120);
            $this->SetFont($font, '', 10);
            $this->Cell(40, 8, 'Paid:', 0, 0, 'R');
            $paid = $this->invoice['total'] - $this->invoice['balance_due'];
            $this->Cell(30, 8, $this->currencySymbol . number_format($paid, 2), 0, 1, 'R');
            
            $this->SetX(120);
            $this->SetFont($font, 'B', 11);
            $this->SetTextColor(200, 0, 0);
            $this->Cell(40, 8, 'Balance Due:', 0, 0, 'R');
            $this->Cell(30, 8, $this->currencySymbol . number_format($this->invoice['balance_due'], 2), 0, 1, 'R');
        }
    }
    
    // Helper for watermark rotation
    private function RotatedText(float $x, float $y, string $txt, float $angle): void {
        $this->Rotate($angle, $x, $y);
        $this->Text($x, $y, $txt);
        $this->Rotate(0);
    }
    
    private function Rotate(float $angle, float $x = -1, float $y = -1): void {
        if ($x == -1) $x = $this->x;
        if ($y == -1) $y = $this->y;
        if ($this->angle != 0) {
            $this->_out('Q');
        }
        $this->angle = $angle;
        if ($angle != 0) {
            $angle *= M_PI / 180;
            $c = cos($angle);
            $s = sin($angle);
            $cx = $x * $this->k;
            $cy = ($this->h - $y) * $this->k;
            $this->_out(sprintf('q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm', $c, $s, -$s, $c, $cx, $cy, -$cx, -$cy));
        }
    }
    
    private float $angle = 0;
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
            if ($template && isset($template['styles'])) {
                $styles = $template['styles'];
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
    
    public function download(array $params): void {
        $this->generate($params);
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
            if ($template && isset($template['styles'])) {
                $styles = $template['styles'];
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
