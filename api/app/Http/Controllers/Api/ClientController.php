<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->clients();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $clients = $query->orderBy('name')->get();

        // Append computed attributes
        $clients->each(function ($client) {
            $client->total_revenue = $client->total_revenue;
            $client->invoice_count = $client->invoice_count;
        });

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'sometimes|string|max:20',
            'company' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'tax_number' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:Active,Inactive',
            'notes' => 'sometimes|string',
        ]);

        $client = $request->user()->clients()->create($validated);

        return response()->json($client, 201);
    }

    public function show(Request $request, Client $client)
    {
        $this->authorize('view', $client);

        $client->load('invoices');
        $client->total_revenue = $client->total_revenue;
        $client->invoice_count = $client->invoice_count;

        return response()->json($client);
    }

    public function update(Request $request, Client $client)
    {
        $this->authorize('update', $client);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string|max:20',
            'company' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'tax_number' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:Active,Inactive',
            'notes' => 'sometimes|string',
        ]);

        $client->update($validated);

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client)
    {
        $this->authorize('delete', $client);

        $client->delete();

        return response()->json(['success' => true]);
    }
}
