<?php

class ReportController {
    public function dashboard(): void {
        $userId = Auth::id();
        
        // Total revenue (paid invoices)
        $invoices = Invoice::query()->where('user_id', $userId)->get();
        
        $totalRevenue = 0;
        $outstanding = 0;
        $overdue = 0;
        $overdueCount = 0;
        
        $today = date('Y-m-d');
        
        foreach ($invoices as $inv) {
            if ($inv['status'] === 'Paid') {
                $totalRevenue += (float) $inv['total'];
            } elseif (in_array($inv['status'], ['Pending', 'Sent'])) {
                $outstanding += (float) $inv['total'];
                
                if ($inv['due_date'] < $today) {
                    $overdue += (float) $inv['total'];
                    $overdueCount++;
                }
            }
        }
        
        $activeClients = Client::query()
            ->where('user_id', $userId)
            ->where('status', 'Active')
            ->count();
        
        Response::json([
            'total_revenue' => $totalRevenue,
            'outstanding' => $outstanding,
            'overdue' => $overdue,
            'overdue_count' => $overdueCount,
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
        foreach ($invoices as $inv) {
            $status = $inv['status'];
            if (!isset($statusCounts[$status])) {
                $statusCounts[$status] = ['status' => $status, 'count' => 0];
            }
            $statusCounts[$status]['count']++;
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
                ->where('status', 'Paid')
                ->get();
            
            $revenue = array_sum(array_column($invoices, 'total'));
            
            $clientRevenues[] = [
                'id' => $client['id'],
                'name' => $client['name'],
                'total' => $revenue
            ];
        }
        
        // Sort by revenue descending
        usort($clientRevenues, fn($a, $b) => $b['total'] <=> $a['total']);
        
        Response::json(array_slice($clientRevenues, 0, $limit));
    }
    
    public function incomeExpense(): void {
        $request = new Request();
        $year = (int) ($request->query('year') ?? date('Y'));
        $userId = Auth::id();
        
        $invoices = Invoice::query()
            ->where('user_id', $userId)
            ->where('status', 'Paid')
            ->get();
        
        $income = 0;
        foreach ($invoices as $inv) {
            if (date('Y', strtotime($inv['date'])) == $year) {
                $income += (float) $inv['total'];
            }
        }
        
        Response::json([
            'income' => $income,
            'expenses' => 0, // Placeholder - no expense tracking yet
            'profit' => $income
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
        
        $invoices = array_map(function($inv) {
            $inv['client'] = Client::query()->find($inv['client_id']);
            return $inv;
        }, $invoices);
        
        Response::json($invoices);
    }
    
    /**
     * Get payment timeline analytics - how quickly clients pay
     */
    public function paymentTimeline(): void {
        $userId = Auth::id();
        
        // Get all payments with their invoice data
        $payments = Payment::query()->where('user_id', $userId)->get();
        
        $timeline = [
            'within_7' => 0,
            '8_to_14' => 0,
            '15_to_30' => 0,
            'over_30' => 0,
        ];
        
        $total = count($payments);
        
        foreach ($payments as $payment) {
            $invoice = Invoice::query()->find($payment['invoice_id']);
            if (!$invoice) continue;
            
            $invoiceDate = strtotime($invoice['date']);
            $paymentDate = strtotime($payment['date']);
            $daysDiff = floor(($paymentDate - $invoiceDate) / 86400);
            
            if ($daysDiff <= 7) {
                $timeline['within_7']++;
            } elseif ($daysDiff <= 14) {
                $timeline['8_to_14']++;
            } elseif ($daysDiff <= 30) {
                $timeline['15_to_30']++;
            } else {
                $timeline['over_30']++;
            }
        }
        
        // Convert to percentages
        $result = [
            ['name' => 'Within 7 days', 'value' => $total > 0 ? round(($timeline['within_7'] / $total) * 100) : 0, 'count' => $timeline['within_7']],
            ['name' => '8-14 days', 'value' => $total > 0 ? round(($timeline['8_to_14'] / $total) * 100) : 0, 'count' => $timeline['8_to_14']],
            ['name' => '15-30 days', 'value' => $total > 0 ? round(($timeline['15_to_30'] / $total) * 100) : 0, 'count' => $timeline['15_to_30']],
            ['name' => '30+ days', 'value' => $total > 0 ? round(($timeline['over_30'] / $total) * 100) : 0, 'count' => $timeline['over_30']],
        ];
        
        $paidWithin14Days = $timeline['within_7'] + $timeline['8_to_14'];
        
        Response::json([
            'timeline' => $result,
            'total_payments' => $total,
            'paid_within_14_days' => $total > 0 ? round(($paidWithin14Days / $total) * 100) : 0,
        ]);
    }
    
    /**
     * Get billing history for subscription payments
     */
    public function billingHistory(): void {
        $userId = Auth::id();
        
        $db = Database::getInstance()->getConnection();
        
        // Get payment transactions (subscription payments)
        $stmt = $db->prepare("
            SELECT id, plan, amount, payment_id, status, created_at, completed_at
            FROM payment_transactions
            WHERE user_id = ? AND status = 'completed'
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$userId]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $history = array_map(function($tx) {
            return [
                'id' => $tx['id'],
                'date' => $tx['completed_at'] ?? $tx['created_at'],
                'amount' => (float) $tx['amount'],
                'plan' => ucfirst($tx['plan']),
                'status' => $tx['status'],
                'payment_id' => $tx['payment_id'],
            ];
        }, $transactions);
        
        Response::json($history);
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
        
        foreach ($invoices as $inv) {
            if ($inv['status'] === 'Paid') {
                $totalRevenue += (float) $inv['total'];
                $paidCount++;
            } elseif (in_array($inv['status'], ['Pending', 'Sent'])) {
                $outstanding += (float) $inv['total'];
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
}
