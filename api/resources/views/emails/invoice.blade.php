<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #e5e7eb;
        }
        .logo {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
            margin-bottom: 12px;
        }
        .company-name {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 0;
        }
        h1 {
            color: #111827;
            font-size: 24px;
            margin-bottom: 8px;
        }
        .invoice-number {
            color: #3b82f6;
            font-weight: 600;
        }
        .details-grid {
            display: table;
            width: 100%;
            margin: 24px 0;
        }
        .details-row {
            display: table-row;
        }
        .details-label {
            display: table-cell;
            padding: 8px 0;
            color: #6b7280;
            width: 120px;
        }
        .details-value {
            display: table-cell;
            padding: 8px 0;
            color: #111827;
            font-weight: 500;
        }
        .custom-message {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            font-style: italic;
            color: #4b5563;
        }
        .total-box {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 24px 0;
        }
        .total-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 4px;
        }
        .total-amount {
            font-size: 32px;
            font-weight: 700;
        }
        .due-date {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 8px;
        }
        .cta-button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
        }
        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
        }
        .attachment-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">I</div>
            <p class="company-name">{{ $invoice->user->businessName ?? 'IEOSUIA Business' }}</p>
        </div>

        <h1>Invoice <span class="invoice-number">#{{ $invoice->invoice_number }}</span></h1>
        
        <p>Dear {{ $invoice->client->name }},</p>
        
        <p>Thank you for your business. Please find attached your invoice.</p>

        @if($customMessage)
        <div class="custom-message">
            "{{ $customMessage }}"
        </div>
        @endif

        <div class="details-grid">
            <div class="details-row">
                <span class="details-label">Invoice Date:</span>
                <span class="details-value">{{ \Carbon\Carbon::parse($invoice->date)->format('d M Y') }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Due Date:</span>
                <span class="details-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Status:</span>
                <span class="details-value">{{ $invoice->status }}</span>
            </div>
        </div>

        <div class="total-box">
            <div class="total-label">Amount Due</div>
            <div class="total-amount">R{{ number_format($invoice->total, 2) }}</div>
            <div class="due-date">Due by {{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
        </div>

        <div class="attachment-note">
            📎 The full invoice PDF is attached to this email for your records.
        </div>

        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

        <div class="footer">
            <p>This invoice was sent by {{ $invoice->user->businessName ?? $invoice->user->name }}</p>
            <p>Powered by IEOSUIA Invoices & Books</p>
        </div>
    </div>
</body>
</html>
