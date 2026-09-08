<?php

require_once __DIR__ . '/../lib/FPDF.php';

class InvoicePDF extends FPDF {
    private array $invoice;
    private array $user;
    private array $styles;
    private array $logoCandidates = [];
    private string $templateSlug = 'general-corporate-blue';
    private string $currencySymbol = 'R';
    
    public function setData(array $invoice, array $user, array $styles = []): void {
        $this->invoice = $invoice;
        $metadata = is_array($invoice['metadata'] ?? null) ? $invoice['metadata'] : [];
        $this->logoCandidates = array_values(array_filter([
            $metadata['invoice_logo_path'] ?? null,
            $user['logo_path'] ?? $user['logoPath'] ?? null,
        ]));
        $overrideMap = [
            'business_name'=>'business_name', 'business_address'=>'address', 'business_email'=>'email',
            'business_phone'=>'phone', 'business_tax_number'=>'tax_number', 'business_registration_number'=>'registration_number',
            'business_website'=>'website', 'invoice_logo_path'=>'logo_path', 'bank_name'=>'bank_name',
            'account_name'=>'account_name', 'account_number'=>'account_number', 'branch_code'=>'branch_code',
            'swift_code'=>'swift_code', 'payment_instructions'=>'payment_instructions',
        ];
        foreach ($overrideMap as $metadataKey => $userKey) {
            // Empty snapshots from an older invoice must not erase current
            // profile details. A real invoice override always has a value.
            if (array_key_exists($metadataKey, $metadata) && $metadata[$metadataKey] !== '') $user[$userKey] = $metadata[$metadataKey];
        }
        $this->user = $user;
        $legacySlugs = ['general-classic'=>'general-corporate-blue','general-modern'=>'general-teal-modern','general-minimal'=>'general-minimal-monochrome','general-corporate'=>'general-corporate-blue','general-bold'=>'general-orange-creative','general-elegant'=>'general-purple-clean','general-compact'=>'general-warm-minimal','general-premium'=>'general-executive-navy-gold'];
        $savedSlug = $invoice['template_slug'] ?? 'general-corporate-blue';
        $this->templateSlug = $legacySlugs[$savedSlug] ?? $savedSlug;
        $templateTokens = [
            'general-corporate-blue'=>['primaryColor'=>'#0756a0','accentColor'=>'#dceafa','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-teal-modern'=>['primaryColor'=>'#159489','accentColor'=>'#dff4f1','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-minimal-monochrome'=>['primaryColor'=>'#151515','accentColor'=>'#eeeeee','headerStyle'=>'left','tableStyle'=>'bordered'],
            'general-executive-navy-gold'=>['primaryColor'=>'#f1c54c','accentColor'=>'#061d32','headerStyle'=>'left','tableStyle'=>'bordered'],
            'general-blue-wave'=>['primaryColor'=>'#0758a8','accentColor'=>'#dceefa','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-purple-clean'=>['primaryColor'=>'#613794','accentColor'=>'#eee8f7','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-olive-corporate'=>['primaryColor'=>'#53781e','accentColor'=>'#eef2df','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-orange-creative'=>['primaryColor'=>'#f05a00','accentColor'=>'#fff0e6','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-red-professional'=>['primaryColor'=>'#ce0808','accentColor'=>'#fdeaea','headerStyle'=>'left','tableStyle'=>'minimal'],
            'general-warm-minimal'=>['primaryColor'=>'#151515','accentColor'=>'#ece8df','headerStyle'=>'left','tableStyle'=>'minimal'],
        ][$this->templateSlug] ?? [];
        $this->styles = array_merge([
            'primaryColor' => '#1e3a5f',
            'accentColor' => '#f59e0b',
            'fontFamily' => 'inter',
            'headerStyle' => 'left',
            'showLogo' => true,
            'showBorder' => true,
            'showWatermark' => false,
            'tableStyle' => 'striped',
        ], $styles, $templateTokens);
        if (preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($metadata['primary_color'] ?? ''))) $this->styles['primaryColor'] = $metadata['primary_color'];
        if (preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($metadata['accent_color'] ?? ''))) $this->styles['accentColor'] = $metadata['accent_color'];
        
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
        
        // Variant page/header treatments are vector shapes so browser and PDF stay resolution independent.
        if ($this->templateSlug === 'general-executive-navy-gold') {
            $this->SetFillColor(6, 29, 50); $this->Rect(0, 0, 210, 297, 'F');
        } elseif ($this->templateSlug === 'general-warm-minimal') {
            $this->SetFillColor(251, 248, 241); $this->Rect(0, 0, 210, 297, 'F');
        } elseif ($this->templateSlug === 'general-teal-modern') {
            $this->SetFillColor($primary[0], $primary[1], $primary[2]); $this->Rect(0, 0, 13, 32, 'F');
        } elseif ($this->templateSlug === 'general-blue-wave') {
            $this->SetFillColor(220, 238, 250); $this->Rect(125, 0, 85, 8, 'F');
            $this->SetFillColor($primary[0], $primary[1], $primary[2]); $this->Rect(155, 0, 55, 4, 'F');
        } else {
            $this->SetFillColor(255, 255, 255); $this->Rect(0, 0, 210, 34, 'F');
        }
        
        // Border accent line
        if ($this->styles['showBorder']) {
            $this->SetFillColor($accent[0], $accent[1], $accent[2]);
            if ($this->templateSlug === 'general-orange-creative' || $this->templateSlug === 'general-red-professional') $this->Rect(0, 294, 210, 3, 'F');
        }
        
        // Company header based on alignment
        $this->SetTextColor($this->templateSlug === 'general-executive-navy-gold' ? 255 : 20, $this->templateSlug === 'general-executive-navy-gold' ? 255 : 28, $this->templateSlug === 'general-executive-navy-gold' ? 255 : 38);
        $businessName = $this->user['business_name'] ?? $this->user['businessName'] ?? $this->user['name'];
        $headerLogoPath = $this->resolveLogoPath();
        if ($headerStyle !== 'left' && $this->styles['showLogo'] && $headerLogoPath !== null) {
            $this->drawLogo($headerLogoPath, 15, 5, 22, 16);
        }
        
        if ($headerStyle === 'center') {
            // Centered header
            $this->SetFont($font, 'B', 22);
            $this->SetXY(15, 6);
            $this->Cell(180, 10, $businessName, 0, 1, 'C');
            
            $this->SetFont($font, '', 10);
            $this->SetXY(15, 17);
            $address = $this->user['address'] ?? '';
            $this->Cell(180, 5, $address, 0, 1, 'C');
            
            if (!empty($this->user['phone'])) {
                $this->SetXY(15, 23);
                $this->Cell(180, 5, $this->user['phone'], 0, 1, 'C');
            }
        } elseif ($headerStyle === 'right') {
            // Right-aligned header
            $this->SetFont($font, 'B', 22);
            $this->SetXY(15, 6);
            $this->Cell(180, 10, $businessName, 0, 1, 'R');
            
            $this->SetFont($font, '', 10);
            $this->SetXY(15, 17);
            $address = $this->user['address'] ?? '';
            $this->Cell(180, 5, $address, 0, 1, 'R');
            
            if (!empty($this->user['phone'])) {
                $this->SetXY(15, 23);
                $this->Cell(180, 5, $this->user['phone'], 0, 1, 'R');
            }
        } else {
            // Left-aligned header (default)
            $businessX = 15;
            $logoPath = $this->resolveLogoPath();
            if ($this->styles['showLogo'] && $logoPath !== null) {
                $businessX = 15 + $this->drawLogo($logoPath, 15, 5, 22, 16) + 3;
            }
            $this->SetFont($font, 'B', 22);
            $this->SetXY($businessX, 6);
            $this->Cell(0, 10, $businessName, 0, 1);
            
            $this->SetFont($font, '', 10);
            $this->SetXY($businessX, 17);
            $address = $this->user['address'] ?? '';
            $this->Cell(0, 5, $address, 0, 1);
            
            if (!empty($this->user['phone'])) {
                $this->SetXY($businessX, 23);
                $this->Cell(0, 5, $this->user['phone'], 0, 1);
            }
        }
        
        // Keep the document title in the header instead of reserving a second
        // oversized band beneath the business identity.
        $this->SetTextColor($primary[0], $primary[1], $primary[2]);
        $this->SetFont($font, 'B', 28);
        if ($this->templateSlug === 'general-teal-modern') {
            $titleWidth = 95;
            $titleAlignment = 'L';
        } else {
            $titleWidth = 90;
            $titleAlignment = 'R';
        }

        $contactDetails = array_filter([
            $this->user['email'] ?? null,
            $this->user['website'] ?? null,
            !empty($this->user['registration_number'] ?? null) ? 'Reg: ' . $this->user['registration_number'] : null,
            !empty($this->user['tax_number'] ?? $this->user['taxNumber'] ?? null)
                ? 'VAT: ' . ($this->user['tax_number'] ?? $this->user['taxNumber'])
                : null,
        ]);
        if ($contactDetails) {
            $this->SetFont($font, '', 8);
            $this->SetXY(15, 28);
            $this->Cell(180, 4, implode(' | ', $contactDetails), 0, 1, $headerStyle === 'right' ? 'R' : ($headerStyle === 'center' ? 'C' : 'L'));
        }
        $titles = ['standard_invoice'=>'INVOICE','tax_invoice'=>'TAX INVOICE','pro_forma'=>'PRO FORMA INVOICE','commercial'=>'COMMERCIAL INVOICE','interim'=>'INTERIM INVOICE','final'=>'FINAL INVOICE','recurring'=>'RECURRING INVOICE','deposit'=>'DEPOSIT INVOICE','progress'=>'PROGRESS INVOICE','quote'=>'QUOTE / ESTIMATE','credit_note'=>'CREDIT NOTE','debit_note'=>'DEBIT NOTE','receipt'=>'RECEIPT'];
        // Contact rendering moves FPDF's cursor. Restore the title coordinates
        // so the heading cannot be pushed off-page or reserve phantom space.
        $this->SetXY($this->templateSlug === 'general-teal-modern' ? 15 : 105, $this->templateSlug === 'general-teal-modern' ? 26 : 6);
        $this->Cell($titleWidth, 10, $titles[$this->invoice['document_type'] ?? 'standard_invoice'] ?? 'INVOICE', 0, 1, $titleAlignment);
    }

    private function resolveLogoPath(): ?string {
        foreach ($this->logoCandidates as $logo) {
            $extension = strtolower(pathinfo((string) $logo, PATHINFO_EXTENSION));
            if (!in_array($extension, ['png', 'jpg', 'jpeg'], true)) continue;
            foreach (['invoice-logos', 'logos'] as $folder) {
                $path = __DIR__ . '/../uploads/' . $folder . '/' . basename((string) $logo);
                if (is_file($path) && is_readable($path)) return $path;
            }
        }
        return null;
    }

    private function drawLogo(string $path, float $x, float $y, float $maxWidth, float $maxHeight): float {
        $size = @getimagesize($path);
        if (!$size || empty($size[0]) || empty($size[1])) { $this->Image($path, $x, $y, $maxWidth, 0); return $maxWidth; }
        $ratio = $size[0] / $size[1];
        $width = $maxWidth; $height = $width / $ratio;
        if ($height > $maxHeight) { $height = $maxHeight; $width = $height * $ratio; }
        $this->Image($path, $x, $y + (($maxHeight - $height) / 2), $width, $height);
        return $width;
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
        $documentTitles = ['standard_invoice'=>'Invoice','tax_invoice'=>'Tax Invoice','pro_forma'=>'Pro Forma Invoice','commercial'=>'Commercial Invoice','interim'=>'Interim Invoice','final'=>'Final Invoice','recurring'=>'Recurring Invoice','deposit'=>'Deposit Invoice','progress'=>'Progress Invoice','quote'=>'Quote / Estimate','credit_note'=>'Credit Note','debit_note'=>'Debit Note','receipt'=>'Receipt'];
        $documentType = $this->invoice['document_type'] ?? 'standard_invoice';
        $documentLabel = $documentTitles[$documentType] ?? 'Invoice';
        $recipientLabel = $documentType === 'credit_note' ? 'Credit To' : ($documentType === 'debit_note' ? 'Debit To' : ($documentType === 'receipt' ? 'Received From' : 'Bill To'));
        $font = $this->getFont();
        $this->SetFont($font, '', 10);
        
        // Invoice details and client info
        $this->SetY($this->templateSlug === 'general-teal-modern' ? 37 : 35);
        
        // Two-column layout
        $this->SetFont($font, 'B', 11);
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $this->SetTextColor($primary[0], $primary[1], $primary[2]);
        $this->Cell(95, 7, $documentLabel . ' Details', 0, 0);
        $this->Cell(95, 7, $recipientLabel, 0, 1);
        
        $this->SetTextColor(0, 0, 0);
        $this->SetFont($font, '', 10);
        
        $this->Cell(95, 6, $documentLabel . ' #: ' . $this->invoice['invoice_number'], 0, 0);
        $this->SetFont($font, 'B', 10);
        $this->Cell(95, 6, $this->invoice['client']['name'] ?? '', 0, 1);
        
        $this->SetFont($font, '', 10);
        $this->Cell(95, 6, ($documentType === 'receipt' ? 'Payment Date: ' : 'Date: ') . date('d M Y', strtotime($this->invoice['date'])), 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['company'] ?? '', 0, 1);
        
        $dueLabel = in_array($documentType, ['credit_note', 'receipt'], true) ? '' : 'Due: ' . date('d M Y', strtotime($this->invoice['due_date']));
        $this->Cell(95, 6, $dueLabel, 0, 0);
        $this->Cell(95, 6, $this->invoice['client']['email'] ?? '', 0, 1);
        
        // Original document reference takes priority for linked adjustments/receipts.
        $currency = $this->invoice['currency'] ?? 'ZAR';
        $metadata = is_array($this->invoice['metadata'] ?? null) ? $this->invoice['metadata'] : [];
        if (!empty($metadata['original_invoice_number'])) {
            $this->Cell(95, 6, 'Original Invoice: ' . $metadata['original_invoice_number'], 0, 0);
        } elseif ($currency !== 'ZAR') {
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

        // Flexible category metadata is rendered without storing sensitive domain data in fixed columns.
        $metadata = $this->invoice['metadata'] ?? [];
        if (is_array($metadata) && $metadata) {
            $this->Ln(4);
            $shown = 0;
            foreach ($metadata as $key => $value) {
                if ($value === '' || $value === null || $shown >= 8) continue;
                if (!is_scalar($value) || in_array((string) $key, ['business_name','business_address','business_email','business_phone','business_tax_number','business_registration_number','business_website','invoice_logo_path','bank_name','account_name','account_number','branch_code','swift_code','payment_instructions','primary_color','accent_color','payment_history','payment_date','issued_at','billing_cycle_date','original_invoice_id','original_invoice_number','derived_document'], true)) continue;
                $label = ucwords(trim(preg_replace('/(?<!^)[A-Z]/', ' $0', str_replace('_', ' ', (string) $key))));
                $this->SetFont($font, 'B', 8);
                $this->Cell(34, 5, $label . ':', 0, 0);
                $this->SetFont($font, '', 8);
                $this->Cell(56, 5, mb_substr((string) $value, 0, 55), 0, $shown % 2 ? 1 : 0);
                $shown++;
            }
            if ($shown % 2) $this->Ln(5);
        }
        
        $this->Ln(7);
        
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
        $paymentRows = [
            'Bank' => $this->user['bank_name'] ?? '', 'Account name' => $this->user['account_name'] ?? '',
            'Account number' => $this->user['account_number'] ?? '', 'Branch code' => $this->user['branch_code'] ?? '',
            'SWIFT' => $this->user['swift_code'] ?? '',
        ];
        foreach ($paymentRows as $label => $value) {
            if ($value === '') continue;
            $this->SetX(15);
            $this->SetFont($font, 'B', 8);
            $this->Cell(32, 5, $label . ':', 0, 0);
            $this->SetFont($font, '', 8);
            $this->Cell(148, 5, mb_substr((string) $value, 0, 90), 0, 1);
        }
        $instructions = $this->user['payment_instructions'] ?? 'Please include the invoice number in your payment reference.';
        if ($instructions !== '') {
            $this->SetX(15);
            $this->SetFont($font, '', 8);
            $this->MultiCell(180, 4.5, (string) $instructions);
        }
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
        
        $this->SetX(15);
        $this->Cell(70, 9, '  Description', $border, 0, 'L', true);
        $this->Cell(20, 9, 'Qty', $border, 0, 'C', true);
        $this->Cell(30, 9, 'Price', $border, 0, 'R', true);
        $this->Cell(25, 9, 'Tax', $border, 0, 'R', true);
        $this->Cell(35, 9, 'Total', $border, 1, 'R', true);
        
        // Table rows
        $this->SetTextColor(0, 0, 0);
        $this->SetFont($font, '', 10);
        
        $fill = false;
        $items = $this->invoice['items'] ?? [];
        
        $currentGroup = null;
        foreach ($items as $item) {
            if ($this->GetY() > 250) {
                $this->AddPage();
                $this->SetY($this->templateSlug === 'general-teal-modern' ? 37 : 35);
                $this->SetFillColor($primary[0], $primary[1], $primary[2]);
                $this->SetTextColor(255, 255, 255);
                $this->SetFont($font, 'B', 10);
                $this->SetX(15);
                $this->Cell(70, 9, '  Description', $border, 0, 'L', true);
                $this->Cell(20, 9, 'Qty', $border, 0, 'C', true);
                $this->Cell(30, 9, 'Price', $border, 0, 'R', true);
                $this->Cell(25, 9, 'Tax', $border, 0, 'R', true);
                $this->Cell(35, 9, 'Total', $border, 1, 'R', true);
                $this->SetTextColor(0, 0, 0);
            }
            $group = trim((string) ($item['group_name'] ?? ''));
            if ($group !== '' && $group !== $currentGroup) {
                $this->SetFont($font, 'B', 9);
                $this->SetFillColor(235, 238, 242);
                $this->SetX(15);
                $this->Cell(180, 7, strtoupper($group), 0, 1, 'L', true);
                $this->SetFont($font, '', 10);
                $currentGroup = $group;
            }
            // Striped background
            if ($tableStyle === 'striped' && $fill) {
                $this->SetFillColor(248, 248, 248);
            } else {
                $this->SetFillColor(255, 255, 255);
            }
            
            $rowBorder = $tableStyle === 'bordered' ? 'LR' : 0;
            $useFill = ($tableStyle === 'striped' && $fill) || $tableStyle === 'bordered';
            
            $description = trim(($item['sku'] ?? '') . (($item['sku'] ?? '') ? '  ' : '') . $item['name']);
            $this->SetX(15);
            $this->Cell(70, 8, '  ' . mb_substr($description, 0, 38), $rowBorder, 0, 'L', $useFill);
            $this->Cell(20, 8, $item['quantity'], $rowBorder, 0, 'C', $useFill);
            $this->Cell(30, 8, $this->currencySymbol . number_format($item['price'], 2), $rowBorder, 0, 'R', $useFill);
            $this->Cell(25, 8, number_format($item['tax_rate'], 1) . '%', $rowBorder, 0, 'R', $useFill);
            $this->Cell(35, 8, $this->currencySymbol . number_format($item['total'], 2), $rowBorder, 1, 'R', $useFill);
            
            $fill = !$fill;
        }
        
        // Close table
        if ($tableStyle !== 'minimal') {
            $this->SetDrawColor($primary[0], $primary[1], $primary[2]);
            $this->SetX(15);
            $this->Cell(180, 0, '', 'T');
        }
    }
    
    private function renderTotals(): void {
        $primary = $this->hexToRgb($this->styles['primaryColor']);
        $font = $this->getFont();
        
        $this->SetX(110);
        $this->SetFont($font, '', 10);
        $documentType = $this->invoice['document_type'] ?? 'standard_invoice';
        $subtotalLabel = $documentType === 'credit_note' ? 'Credit Subtotal:' : ($documentType === 'debit_note' ? 'Debit Subtotal:' : ($documentType === 'receipt' ? 'Payment Subtotal:' : 'Subtotal:'));
        $totalLabel = $documentType === 'credit_note' ? 'Total Credit:' : ($documentType === 'debit_note' ? 'Total Debit:' : ($documentType === 'receipt' ? 'Amount Received:' : 'Total:'));
        $this->Cell(45, 8, $subtotalLabel, 0, 0, 'R');
        $this->Cell(40, 8, $this->currencySymbol . number_format($this->invoice['subtotal'], 2), 0, 1, 'R');
        
        $this->SetX(110);
        $this->Cell(45, 8, 'Tax:', 0, 0, 'R');
        $this->Cell(40, 8, $this->currencySymbol . number_format($this->invoice['tax'], 2), 0, 1, 'R');

        if (!in_array($documentType, ['credit_note', 'debit_note', 'receipt'], true) && ((float) ($this->invoice['credit_total'] ?? 0) > 0 || (float) ($this->invoice['debit_total'] ?? 0) > 0)) {
            $this->SetX(110);
            $this->Cell(45, 7, 'Original Total:', 0, 0, 'R');
            $this->Cell(40, 7, $this->currencySymbol . number_format((float) ($this->invoice['base_total'] ?? $this->invoice['total']), 2), 0, 1, 'R');
            if ((float) ($this->invoice['credit_total'] ?? 0) > 0) { $this->SetX(110); $this->Cell(45, 7, 'Credits:', 0, 0, 'R'); $this->Cell(40, 7, '-' . $this->currencySymbol . number_format((float) $this->invoice['credit_total'], 2), 0, 1, 'R'); }
            if ((float) ($this->invoice['debit_total'] ?? 0) > 0) { $this->SetX(110); $this->Cell(45, 7, 'Debits:', 0, 0, 'R'); $this->Cell(40, 7, '+' . $this->currencySymbol . number_format((float) $this->invoice['debit_total'], 2), 0, 1, 'R'); }
        }
        
        // Total with primary color background
        $this->SetX(110);
        $this->SetFont($font, 'B', 12);
        $this->SetFillColor($primary[0], $primary[1], $primary[2]);
        $this->SetTextColor(255, 255, 255);
        $this->Cell(45, 10, $totalLabel, 1, 0, 'R', true);
        $this->Cell(40, 10, $this->currencySymbol . number_format($this->invoice['total'], 2), 1, 1, 'R', true);
        
        // Balance due (if applicable)
        if (!in_array($documentType, ['credit_note', 'debit_note', 'receipt'], true) && isset($this->invoice['balance_due']) && $this->invoice['balance_due'] > 0 && $this->invoice['balance_due'] < $this->invoice['total']) {
            $this->SetTextColor(0, 0, 0);
            $this->SetX(110);
            $this->SetFont($font, '', 10);
            $this->Cell(45, 8, 'Paid:', 0, 0, 'R');
            $paid = $this->invoice['total'] - $this->invoice['balance_due'];
            $this->Cell(40, 8, $this->currencySymbol . number_format($paid, 2), 0, 1, 'R');
            
            $this->SetX(110);
            $this->SetFont($font, 'B', 11);
            $this->SetTextColor(200, 0, 0);
            $this->Cell(45, 8, 'Balance Due:', 0, 0, 'R');
            $this->Cell(40, 8, $this->currencySymbol . number_format($this->invoice['balance_due'], 2), 0, 1, 'R');
        }
        $payments = array_values(array_filter($this->invoice['payment_history'] ?? [], fn($payment) => empty($payment['voided_at'])));
        if ($payments) {
            $this->Ln(3); $this->SetX(110); $this->SetTextColor(0, 0, 0); $this->SetFont($font, 'B', 9); $this->Cell(85, 6, 'Payments Received', 0, 1, 'R');
            $this->SetFont($font, '', 8);
            foreach ($payments as $payment) {
                $date = !empty($payment['payment_date']) ? date('d M Y', strtotime($payment['payment_date'])) : '';
                $this->SetX(110); $this->Cell(85, 5, $date . '  ' . $this->currencySymbol . number_format((float) ($payment['amount'] ?? 0), 2), 0, 1, 'R');
            }
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
        
        $user = User::query()->find(Auth::id());
        
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
        $filePrefix = str_replace('_', '-', (string) ($invoice['document_type'] ?? 'invoice'));
        $filename = $filePrefix . '-' . $invoice['invoice_number'] . '.pdf';
        
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
        
        $user = User::query()->find(Auth::id());
        
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
