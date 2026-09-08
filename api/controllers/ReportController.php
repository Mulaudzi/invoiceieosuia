<?php

class ReportController {
    public function dashboard(): void {
        $userId = Auth::id();
        
        // Get all invoices for the user
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        
        $totalRevenue = 0;
        $outstanding = 0;
        $overdue = 0;
        $overdueCount = 0;
        $totalInvoices = count($invoices);
        $paidInvoices = 0;
        $pendingInvoices = 0;
        $overdueInvoices = 0;
        
        $today = date('Y-m-d');
        
        $invoiceModel = new Invoice();
        foreach ($invoices as $rawInvoice) {
            $inv = $invoiceModel->withRelations($rawInvoice);
            if (in_array(($inv['document_type'] ?? ''), ['receipt', 'credit_note', 'debit_note'], true)) continue;
            if ($inv['status'] === 'Paid') {
                $totalRevenue += (float) $inv['total'];
                $paidInvoices++;
            } elseif (in_array($inv['status'], ['Pending', 'Sent', 'Partially Paid', 'Overdue'])) {
                $outstanding += (float) $inv['balance_due'];
                $pendingInvoices++;
                
                if ($inv['due_date'] < $today) {
                    $overdue += (float) $inv['balance_due'];
                    $overdueCount++;
                    $overdueInvoices++;
                }
            }
        }
        
        // Get client counts
        $allClients = Client::query()->where('user_id', $userId)->get();
        $totalClients = count($allClients);
        $activeClients = Client::query()
            ->where('user_id', $userId)
            ->where('status', 'Active')
            ->count();
        
        Response::json([
            'total_revenue' => $totalRevenue,
            'outstanding' => $outstanding,
            'overdue_amount' => $overdue,
            'overdue_count' => $overdueCount,
            'total_invoices' => $totalInvoices,
            'paid_invoices' => $paidInvoices,
            'pending_invoices' => $pendingInvoices,
            'overdue_invoices' => $overdueInvoices,
            'total_clients' => $totalClients,
            'active_clients' => $activeClients
        ]);
    }
    
    public function monthlyRevenue(): void {
        $request = new Request();
        $months = (int) ($request->query('months') ?? 12);
        $userId = Auth::id();
        
        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->where('status', 'Paid')
            ->get();
        
        $monthlyData = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $monthlyData[$date] = [
                'month' => date('M Y', strtotime("-$i months")),
                'revenue' => 0
            ];
        }
        
        foreach ($invoices as $inv) {
            $month = date('Y-m', strtotime($inv['date']));
            if (isset($monthlyData[$month])) {
                $monthlyData[$month]['revenue'] += (float) $inv['total'];
            }
        }
        
        Response::json(array_values($monthlyData));
    }
    
    public function invoiceStatus(): void {
        $userId = Auth::id();
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        
        $statusCounts = [];
        $invoiceModel = new Invoice();
        foreach ($invoices as $rawInvoice) {
            $inv = $invoiceModel->withRelations($rawInvoice);
            $status = $inv['status'];
            if (!isset($statusCounts[$status])) {
                $statusCounts[$status] = ['status' => $status, 'count' => 0, 'amount' => 0];
            }
            $statusCounts[$status]['count']++;
            $statusCounts[$status]['amount'] += $status === 'Paid' ? (float) $inv['total'] : (float) $inv['balance_due'];
        }
        
        Response::json(array_values($statusCounts));
    }
    
    public function topClients(): void {
        $request = new Request();
        $limit = (int) ($request->query('limit') ?? 5);
        $userId = Auth::id();
        
        $clients = Client::query()->where('user_id', $userId)->get();
        
        $clientRevenues = [];
        foreach ($clients as $client) {
            $invoices = Invoice::query()
                ->where('client_id', $client['id'])
                ->get();
            
            $paidInvoices = Invoice::query()
                ->where('client_id', $client['id'])
                ->where('status', 'Paid')
                ->get();
            
            $revenue = array_sum(array_column($paidInvoices, 'total'));
            
            $clientRevenues[] = [
                'client' => [
                    'id' => $client['id'],
                    'name' => $client['name'],
                    'email' => $client['email'],
                    'phone' => $client['phone'] ?? null,
                    'company' => $client['company'] ?? null,
                    'status' => $client['status'] ?? 'Active',
                    'userId' => $client['user_id'],
                    'createdAt' => $client['created_at']
                ],
                'total' => $revenue,
                'invoices' => count($invoices)
            ];
        }
        
        // Sort by revenue descending
        usort($clientRevenues, fn($a, $b) => $b['total'] <=> $a['total']);
        
        Response::json(array_slice($clientRevenues, 0, $limit));
    }
    
    public function incomeExpense(): void {
        $request = new Request();
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $userId = Auth::id();
        
        // Get invoices based on date range
        $query = Invoice::query()
            ->where('user_id', $userId)
            ->where('status', 'Paid');
        
        if ($startDate) {
            $query->where('date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('date', '<=', $endDate);
        }
        
        $invoices = $query->get();
        
        // Calculate totals
        $income = 0;
        $expenses = 0; // Placeholder - no expense tracking yet
        
        // Group by month for by_month breakdown
        $byMonth = [];
        foreach ($invoices as $inv) {
            $income += (float) $inv['total'];
            
            // Build monthly breakdown
            $monthKey = date('Y-m', strtotime($inv['date']));
            if (!isset($byMonth[$monthKey])) {
                $byMonth[$monthKey] = [
                    'month' => date('M Y', strtotime($inv['date'])),
                    'income' => 0,
                    'expenses' => 0
                ];
            }
            $byMonth[$monthKey]['income'] += (float) $inv['total'];
        }
        
        // Sort months chronologically
        ksort($byMonth);
        
        $net = $income - $expenses;
        
        Response::json([
            'income' => $income,
            'expenses' => $expenses,
            'net' => $net,
            'by_month' => array_values($byMonth)
        ]);
    }
    
    public function recentInvoices(): void {
        $request = new Request();
        $limit = (int) ($request->query('limit') ?? 5);
        $userId = Auth::id();
        
        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($limit)
            ->get();
        
        $invoiceModel = new Invoice();
        $invoices = array_map(function($inv) use ($invoiceModel) {
            return $invoiceModel->withRelations($inv);
        }, $invoices);
        
        Response::json($invoices);
    }
    
    /**
     * Get extended dashboard stats with invoice counts
     */
    public function extendedStats(): void {
        $userId = Auth::id();
        
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        
        $totalRevenue = 0;
        $outstanding = 0;
        $paidCount = 0;
        $pendingCount = 0;
        $overdueCount = 0;
        
        $today = date('Y-m-d');
        
        $invoiceModel = new Invoice();
        foreach ($invoices as $rawInvoice) {
            $inv = $invoiceModel->withRelations($rawInvoice);
            if ($inv['status'] === 'Paid') {
                $totalRevenue += (float) $inv['total'];
                $paidCount++;
            } elseif (in_array($inv['status'], ['Pending', 'Sent', 'Partially Paid'])) {
                $outstanding += (float) $inv['balance_due'];
                $pendingCount++;
                
                if ($inv['due_date'] < $today) {
                    $overdueCount++;
                }
            }
        }
        
        // Get counts for current month vs last month
        $currentMonthStart = date('Y-m-01');
        $lastMonthStart = date('Y-m-01', strtotime('-1 month'));
        $lastMonthEnd = date('Y-m-t', strtotime('-1 month'));
        
        $currentMonthInvoices = 0;
        $lastMonthInvoices = 0;
        $currentMonthRevenue = 0;
        $lastMonthRevenue = 0;
        
        foreach ($invoices as $inv) {
            $invoiceDate = date('Y-m-d', strtotime($inv['date']));
            
            if ($invoiceDate >= $currentMonthStart) {
                $currentMonthInvoices++;
                if ($inv['status'] === 'Paid') {
                    $currentMonthRevenue += (float) $inv['total'];
                }
            } elseif ($invoiceDate >= $lastMonthStart && $invoiceDate <= $lastMonthEnd) {
                $lastMonthInvoices++;
                if ($inv['status'] === 'Paid') {
                    $lastMonthRevenue += (float) $inv['total'];
                }
            }
        }
        
        // Calculate percentage changes
        $revenueChange = $lastMonthRevenue > 0 
            ? round((($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1) 
            : 0;
        
        // Get new clients this month
        $newClientsThisMonth = Client::query()
            ->where('user_id', $userId)
            ->where('created_at', '>=', $currentMonthStart)
            ->count();
        
        $activeClients = Client::query()
            ->where('user_id', $userId)
            ->where('status', 'Active')
            ->count();
        
        Response::json([
            'total_revenue' => $totalRevenue,
            'outstanding' => $outstanding,
            'total_invoices' => count($invoices),
            'paid_invoices' => $paidCount,
            'pending_invoices' => $pendingCount,
            'overdue_count' => $overdueCount,
            'active_clients' => $activeClients,
            'new_clients_this_month' => $newClientsThisMonth,
            'revenue_change' => $revenueChange,
            'current_month_invoices' => $currentMonthInvoices,
            'last_month_invoices' => $lastMonthInvoices,
        ]);
    }
    
    /**
     * Get monthly invoice count alongside revenue
     */
    public function monthlyStats(): void {
        $request = new Request();
        $months = (int) ($request->query('months') ?? 12);
        $userId = Auth::id();
        
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        
        $monthlyData = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $monthlyData[$date] = [
                'month' => date('M Y', strtotime("-$i months")),
                'revenue' => 0,
                'invoices' => 0,
                'avg_value' => 0,
            ];
        }
        
        foreach ($invoices as $inv) {
            $month = date('Y-m', strtotime($inv['date']));
            if (isset($monthlyData[$month])) {
                $monthlyData[$month]['invoices']++;
                if ($inv['status'] === 'Paid') {
                    $monthlyData[$month]['revenue'] += (float) $inv['total'];
                }
            }
        }
        
        // Calculate average values
        foreach ($monthlyData as &$data) {
            if ($data['invoices'] > 0) {
                $data['avg_value'] = round($data['revenue'] / $data['invoices'], 2);
            }
        }
        
        Response::json(array_values($monthlyData));
    }
    
    /**
     * Export reports in various formats (PDF, Excel, CSV)
     */
    public function summary(): void {
        $userId = Auth::id();
        $request = new Request();
        $days = (int) ($request->query('days') ?? 30);
        
        $startDate = date('Y-m-d', strtotime("-$days days"));
        $today = date('Y-m-d');
        
        // Get invoices in date range
        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->where('date', '>=', $startDate)
            ->get();
        
        // Calculate summary metrics
        $totalInvoiced = 0;
        $totalPaid = 0;
        $totalPending = 0;
        $invoiceCount = 0;
        $paidCount = 0;
        $overdueCount = 0;
        
        foreach ($invoices as $inv) {
            $invoiceCount++;
            $total = (float) $inv['total'];
            $totalInvoiced += $total;
            
            if ($inv['status'] === 'Paid') {
                $totalPaid += $total;
                $paidCount++;
            } elseif (in_array($inv['status'], ['Pending', 'Sent'])) {
                $totalPending += $total;
                if ($inv['due_date'] < $today) {
                    $overdueCount++;
                }
            }
        }
        
        // Get client summary
        $clientsQuery = Client::query()
            ->where('user_id', $userId)
            ->where('created_at', '>=', $startDate);
        
        $newClients = $clientsQuery->count();
        $totalClients = Client::query()->where('user_id', $userId)->count();
        
        Response::json([
            'period_days' => $days,
            'start_date' => $startDate,
            'end_date' => $today,
            'invoices' => [
                'count' => $invoiceCount,
                'total' => $totalInvoiced,
                'paid' => $totalPaid,
                'pending' => $totalPending,
                'paid_count' => $paidCount,
                'overdue_count' => $overdueCount
            ],
            'clients' => [
                'new' => $newClients,
                'total' => $totalClients
            ]
        ]);
    }
    
    public function export(): void {
        $request = new Request();
        $type = strtolower((string) ($request->query('type') ?? 'pdf'));
        $reportType = strtolower((string) ($request->query('report') ?? 'analytics'));
        $userId = Auth::id();

        if ($type !== 'pdf') {
            Response::error('Unsupported report format', 422);
            return;
        }

        require_once __DIR__ . '/../lib/FPDF.php';

        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->orderBy('date', 'DESC')
            ->get();

        $total = 0.0;
        $paid = 0.0;
        foreach ($invoices as $invoice) {
            $amount = (float) ($invoice['total'] ?? 0);
            $total += $amount;
            if (($invoice['status'] ?? '') === 'Paid') {
                $paid += $amount;
            }
        }

        $pdf = new FPDF();
        $pdf->SetTitle('IEOSUIA Invoices Report');
        $pdf->SetAuthor('IEOSUIA Invoices');
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', 'B', 18);
        $pdf->Cell(0, 12, 'IEOSUIA Invoices', 0, 1);
        $pdf->SetFont('Helvetica', '', 11);
        $pdf->Cell(0, 7, ucfirst($reportType) . ' report - ' . date('Y-m-d'), 0, 1);
        $pdf->Ln(3);
        $pdf->SetFont('Helvetica', 'B', 11);
        $pdf->Cell(0, 7, 'Invoices: ' . count($invoices), 0, 1);
        $pdf->Cell(0, 7, 'Total invoiced: R ' . number_format($total, 2), 0, 1);
        $pdf->Cell(0, 7, 'Total paid: R ' . number_format($paid, 2), 0, 1);
        $pdf->Ln(5);

        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(42, 7, 'Invoice', 1);
        $pdf->Cell(27, 7, 'Date', 1);
        $pdf->Cell(31, 7, 'Status', 1);
        $pdf->Cell(38, 7, 'Amount', 1, 1, 'R');
        $pdf->SetFont('Helvetica', '', 9);

        foreach ($invoices as $invoice) {
            if ($pdf->GetY() > 270) {
                $pdf->AddPage();
            }
            $pdf->Cell(42, 7, substr((string) ($invoice['invoice_number'] ?? ''), 0, 22), 1);
            $pdf->Cell(27, 7, (string) ($invoice['date'] ?? ''), 1);
            $pdf->Cell(31, 7, substr((string) ($invoice['status'] ?? ''), 0, 16), 1);
            $pdf->Cell(38, 7, 'R ' . number_format((float) ($invoice['total'] ?? 0), 2), 1, 1, 'R');
        }

        $contents = $pdf->Output('S');
        $filename = 'ieosuia-' . preg_replace('/[^a-z0-9-]+/', '-', $reportType) . '-report-' . date('Y-m-d') . '.pdf';
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($contents));
        echo $contents;
        exit;
    }
}
