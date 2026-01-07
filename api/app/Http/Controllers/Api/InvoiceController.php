<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->invoices()->with(['client', 'template']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Check plan limits
        if (!$user->canCreateInvoice()) {
            return response()->json([
                'success' => false,
                'message' => 'Monthly invoice limit reached. Please upgrade your plan.',
            ], 403);
        }

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'template_id' => 'sometimes|exists:templates,id',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'sometimes|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'sometimes|exists:products,id',
            'items.*.name' => 'required|string',
            'items.*.description' => 'sometimes|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'sometimes|numeric|min:0|max:100',
        ]);

        $invoice = $user->invoices()->create([
            'client_id' => $validated['client_id'],
            'template_id' => $validated['template_id'] ?? null,
            'invoice_number' => Invoice::generateNumber($user->id),
            'date' => $validated['date'],
            'due_date' => $validated['due_date'],
            'notes' => $validated['notes'] ?? null,
            'subtotal' => 0,
            'tax' => 0,
            'total' => 0,
        ]);

        // Create items
        foreach ($validated['items'] as $item) {
            $invoice->items()->create([
                'product_id' => $item['product_id'] ?? null,
                'name' => $item['name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'tax_rate' => $item['tax_rate'] ?? 15,
            ]);
        }

        return response()->json(
            $invoice->load(['client', 'items', 'template']),
            201
        );
    }

    public function show(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        return response()->json(
            $invoice->load(['client', 'items', 'template', 'payments'])
        );
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'template_id' => 'sometimes|exists:templates,id',
            'status' => 'sometimes|in:Draft,Pending,Paid,Overdue',
            'date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'notes' => 'sometimes|string',
            'items' => 'sometimes|array',
            'items.*.id' => 'sometimes|exists:invoice_items,id',
            'items.*.product_id' => 'sometimes|exists:products,id',
            'items.*.name' => 'required|string',
            'items.*.description' => 'sometimes|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'sometimes|numeric|min:0|max:100',
        ]);

        $invoice->update(collect($validated)->except('items')->toArray());

        // Update items if provided
        if (isset($validated['items'])) {
            $existingIds = [];

            foreach ($validated['items'] as $item) {
                if (isset($item['id'])) {
                    $invoiceItem = InvoiceItem::find($item['id']);
                    $invoiceItem->update($item);
                    $existingIds[] = $item['id'];
                } else {
                    $newItem = $invoice->items()->create($item);
                    $existingIds[] = $newItem->id;
                }
            }

            // Remove deleted items
            $invoice->items()->whereNotIn('id', $existingIds)->delete();
        }

        return response()->json(
            $invoice->fresh()->load(['client', 'items', 'template'])
        );
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        $invoice->delete();

        return response()->json(['success' => true]);
    }

    public function pdf(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load(['client', 'items', 'template']);

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'user' => $request->user(),
        ]);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    public function send(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        // In production, send email to client
        // Mail::to($invoice->client->email)->send(new InvoiceMail($invoice));

        $invoice->update(['status' => 'Pending']);

        return response()->json([
            'success' => true,
            'message' => 'Invoice sent successfully',
        ]);
    }

    public function markPaid(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $invoice->update(['status' => 'Paid']);

        return response()->json([
            'success' => true,
            'invoice' => $invoice->fresh(),
        ]);
    }
}
