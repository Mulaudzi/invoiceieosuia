<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $invoices = $user->invoices();
        $clients = $user->clients();

        $totalRevenue = (clone $invoices)->where('status', 'Paid')->sum('total');
        $outstanding = (clone $invoices)->whereIn('status', ['Pending', 'Overdue'])->sum('total');
        $overdueCount = (clone $invoices)->where('status', 'Overdue')->count();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_invoices' => $invoices->count(),
            'outstanding' => $outstanding,
            'overdue_count' => $overdueCount,
            'active_clients' => $clients->where('status', 'Active')->count(),
        ]);
    }

    public function monthlyRevenue(Request $request)
    {
        $user = $request->user();
        $months = $request->get('months', 6);

        $data = $user->invoices()
            ->where('status', 'Paid')
            ->where('date', '>=', now()->subMonths($months))
            ->selectRaw('MONTH(date) as month, YEAR(date) as year, SUM(total) as revenue')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn($row) => [
                'month' => date('M', mktime(0, 0, 0, $row->month, 1)),
                'year' => $row->year,
                'revenue' => (float) $row->revenue,
            ]);

        return response()->json($data);
    }

    public function invoiceStatus(Request $request)
    {
        $user = $request->user();

        $data = $user->invoices()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'name' => $row->status,
                'value' => $row->count,
            ]);

        return response()->json($data);
    }

    public function topClients(Request $request)
    {
        $user = $request->user();
        $limit = $request->get('limit', 5);

        $data = $user->clients()
            ->withSum(['invoices' => fn($q) => $q->where('status', 'Paid')], 'total')
            ->orderByDesc('invoices_sum_total')
            ->limit($limit)
            ->get()
            ->map(fn($client) => [
                'name' => $client->name,
                'revenue' => (float) ($client->invoices_sum_total ?? 0),
            ]);

        return response()->json($data);
    }

    public function incomeExpense(Request $request)
    {
        $user = $request->user();
        $year = $request->get('year', now()->year);

        $income = $user->invoices()
            ->where('status', 'Paid')
            ->whereYear('date', $year)
            ->sum('total');

        // For a full implementation, you'd have an expenses table
        // For now, we'll return income only
        return response()->json([
            'year' => $year,
            'income' => (float) $income,
            'expenses' => 0,
            'profit' => (float) $income,
        ]);
    }

    public function recentInvoices(Request $request)
    {
        $user = $request->user();
        $limit = $request->get('limit', 5);

        return response()->json(
            $user->invoices()
                ->with('client')
                ->orderBy('date', 'desc')
                ->limit($limit)
                ->get()
        );
    }
}
