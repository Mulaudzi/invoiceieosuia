<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        @php
            $styles = $invoice->template?->styles ?? \App\Models\Template::getDefaultStyles();
        @endphp

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: '{{ $styles['fontFamily'] ?? 'Inter' }}', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }

        .container {
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            @if($styles['showBorder'] ?? true)
            border: 1px solid #e5e7eb;
            @endif
        }

        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            text-align: {{ $styles['headerStyle'] ?? 'left' }};
        }

        .logo-section h1 {
            color: {{ $styles['primaryColor'] ?? '#1e3a5f' }};
            font-size: 24px;
            margin-bottom: 5px;
        }

        .invoice-details {
            text-align: right;
        }

        .invoice-number {
            font-size: 20px;
            font-weight: bold;
            color: {{ $styles['primaryColor'] ?? '#1e3a5f' }};
        }

        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 10px;
        }

        .status-paid { background: #d1fae5; color: #059669; }
        .status-pending { background: #fef3c7; color: #d97706; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        .status-draft { background: #e5e7eb; color: #6b7280; }

        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }

        .party {
            width: 45%;
        }

        .party-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 8px;
        }

        .party-name {
            font-weight: bold;
            font-size: 14px;
            color: {{ $styles['primaryColor'] ?? '#1e3a5f' }};
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        th {
            background: {{ $styles['primaryColor'] ?? '#1e3a5f' }};
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }

        @if(($styles['tableStyle'] ?? 'striped') === 'striped')
        tr:nth-child(even) td {
            background: #f9fafb;
        }
        @endif

        .text-right {
            text-align: right;
        }

        .totals {
            margin-left: auto;
            width: 300px;
        }

        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .totals-row.total {
            font-weight: bold;
            font-size: 16px;
            color: {{ $styles['primaryColor'] ?? '#1e3a5f' }};
            border-bottom: none;
            border-top: 2px solid {{ $styles['primaryColor'] ?? '#1e3a5f' }};
            padding-top: 12px;
        }

        .notes {
            margin-top: 40px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }

        .notes-label {
            font-weight: bold;
            margin-bottom: 8px;
        }

        .footer {
            margin-top: 60px;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
        }

        @if($styles['showWatermark'] ?? false)
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(0, 0, 0, 0.03);
            z-index: -1;
        }
        @endif
    </style>
</head>
<body>
    @if($styles['showWatermark'] ?? false)
    <div class="watermark">{{ strtoupper($invoice->status) }}</div>
    @endif

    <div class="container">
        <div class="header">
            <div class="logo-section">
                @if(($styles['showLogo'] ?? true) && $user->logo)
                <img src="{{ $user->logo }}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">
                @endif
                <h1>{{ $user->business_name ?? $user->name }}</h1>
                @if($user->address)
                <p>{{ $user->address }}</p>
                @endif
                @if($user->tax_number)
                <p>Tax No: {{ $user->tax_number }}</p>
                @endif
            </div>
            <div class="invoice-details">
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <p>Date: {{ $invoice->date->format('d M Y') }}</p>
                <p>Due: {{ $invoice->due_date->format('d M Y') }}</p>
                <span class="status status-{{ strtolower($invoice->status) }}">
                    {{ $invoice->status }}
                </span>
            </div>
        </div>

        <div class="parties">
            <div class="party">
                <div class="party-label">From</div>
                <div class="party-name">{{ $user->business_name ?? $user->name }}</div>
                <p>{{ $user->email }}</p>
                @if($user->phone)<p>{{ $user->phone }}</p>@endif
            </div>
            <div class="party">
                <div class="party-label">Bill To</div>
                <div class="party-name">{{ $invoice->client->name }}</div>
                @if($invoice->client->company)<p>{{ $invoice->client->company }}</p>@endif
                <p>{{ $invoice->client->email }}</p>
                @if($invoice->client->address)<p>{{ $invoice->client->address }}</p>@endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 40%">Description</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Price</th>
                    <th class="text-right">Tax</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>
                        <strong>{{ $item->name }}</strong>
                        @if($item->description)
                        <br><span style="color: #6b7280;">{{ $item->description }}</span>
                        @endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">R{{ number_format($item->price, 2) }}</td>
                    <td class="text-right">{{ $item->tax_rate }}%</td>
                    <td class="text-right">R{{ number_format($item->total, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span>R{{ number_format($invoice->subtotal, 2) }}</span>
            </div>
            <div class="totals-row">
                <span>Tax (VAT)</span>
                <span>R{{ number_format($invoice->tax, 2) }}</span>
            </div>
            <div class="totals-row total">
                <span>Total Due</span>
                <span>R{{ number_format($invoice->total, 2) }}</span>
            </div>
        </div>

        @if($invoice->notes)
        <div class="notes">
            <div class="notes-label">Notes</div>
            <p>{{ $invoice->notes }}</p>
        </div>
        @endif

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated by IEOSUIA Invoicing System</p>
        </div>
    </div>
</body>
</html>
