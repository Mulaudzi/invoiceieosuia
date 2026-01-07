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
}
