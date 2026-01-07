<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->products();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'required|numeric|min:0',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'category' => 'sometimes|string|max:100',
            'unit' => 'sometimes|string|max:50',
        ]);

        $product = $request->user()->products()->create($validated);

        return response()->json($product, 201);
    }

    public function show(Request $request, Product $product)
    {
        $this->authorize('view', $product);

        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'category' => 'sometimes|string|max:100',
            'unit' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    public function destroy(Request $request, Product $product)
    {
        $this->authorize('delete', $product);

        $product->delete();

        return response()->json(['success' => true]);
    }

    public function categories(Request $request)
    {
        $categories = $request->user()->products()
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();

        return response()->json($categories);
    }
}
