<?php

class ProductController {
    public function index(): void {
        $request = new Request();
        $query = Product::query()->where('user_id', Auth::id());
        
        $category = $request->query('category');
        if ($category) {
            $query->where('category', $category);
        }
        
        $products = $query->orderBy('name', 'ASC')->get();
        
        // Apply search filter in PHP
        $search = $request->query('search');
        if ($search) {
            $search = strtolower($search);
            $products = array_filter($products, function($p) use ($search) {
                return str_contains(strtolower($p['name']), $search) ||
                       str_contains(strtolower($p['description'] ?? ''), $search);
            });
            $products = array_values($products);
        }
        
        Response::json($products);
    }
    
    public function categories(): void {
        $categories = Product::query()->getCategories(Auth::id());
        Response::json($categories);
    }
    
    public function store(): void {
        $request = new Request();
        $data = $request->validate([
            'name' => 'required|max:255',
            'price' => 'required|numeric',
        ]);
        
        $data = array_merge($request->all(), ['user_id' => Auth::id()]);
        
        $id = Product::query()->create($data);
        $product = Product::query()->find($id);
        
        Response::json($product, 201);
    }
    
    public function show(array $params): void {
        $product = Product::query()->find((int) $params['id']);
        
        if (!$product || $product['user_id'] !== Auth::id()) {
            Response::error('Product not found', 404);
        }
        
        Response::json($product);
    }
    
    public function update(array $params): void {
        $product = Product::query()->find((int) $params['id']);
        
        if (!$product || $product['user_id'] !== Auth::id()) {
            Response::error('Product not found', 404);
        }
        
        $request = new Request();
        Product::query()->update($product['id'], $request->all());
        
        $updated = Product::query()->find($product['id']);
        Response::json($updated);
    }
    
    public function destroy(array $params): void {
        $product = Product::query()->find((int) $params['id']);
        
        if (!$product || $product['user_id'] !== Auth::id()) {
            Response::error('Product not found', 404);
        }
        
        Product::query()->delete($product['id']);
        Response::success();
    }
}
