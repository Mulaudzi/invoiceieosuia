<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->payments()->with('invoice.client');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('invoice', fn($q) => 
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('name', 'like', "%{$search}%"))
            );
        }

        if ($request->has('method')) {
            $query->where('method', $request->method);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:Bank Transfer,Credit Card,Cash,PayPal,Other',
            'date' => 'required|date',
            'reference' => 'sometimes|string|max:100',
            'notes' => 'sometimes|string',
        ]);

        $payment = $request->user()->payments()->create($validated);

        return response()->json(
            $payment->load('invoice.client'),
            201
        );
    }

    public function show(Request $request, Payment $payment)
    {
        $this->authorize('view', $payment);

        return response()->json(
            $payment->load('invoice.client')
        );
    }

    public function destroy(Request $request, Payment $payment)
    {
        $this->authorize('delete', $payment);

        $invoice = $payment->invoice;
        $payment->delete();

        // Revert invoice status if needed
        if ($invoice->status === 'Paid' && $invoice->balance_due > 0) {
            $invoice->update(['status' => 'Pending']);
        }

        return response()->json(['success' => true]);
    }

    public function summary(Request $request)
    {
        $user = $request->user();
        $payments = $user->payments();

        return response()->json([
            'total_received' => $payments->sum('amount'),
            'count' => $payments->count(),
            'by_method' => $payments->selectRaw('method, SUM(amount) as total, COUNT(*) as count')
                ->groupBy('method')
                ->get(),
        ]);
    }
}
