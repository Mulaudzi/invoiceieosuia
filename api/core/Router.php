<?php

class Router {
    private array $routes = [];
    private array $middleware = [];
    
    public function get(string $path, array $handler, array $middleware = []): void {
        $this->addRoute('GET', $path, $handler, $middleware);
    }
    
    public function post(string $path, array $handler, array $middleware = []): void {
        $this->addRoute('POST', $path, $handler, $middleware);
    }
    
    public function put(string $path, array $handler, array $middleware = []): void {
        $this->addRoute('PUT', $path, $handler, $middleware);
    }
    
    public function delete(string $path, array $handler, array $middleware = []): void {
        $this->addRoute('DELETE', $path, $handler, $middleware);
    }
    
    private function addRoute(string $method, string $path, array $handler, array $middleware): void {
        // Convert {param} to regex
        $pattern = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';
        
        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware
        ];
    }
    
    public function dispatch(string $method, string $uri): void {
        // Remove query string
        $uri = parse_url($uri, PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';
        
        // Remove /api prefix if present
        $uri = preg_replace('#^/api#', '', $uri) ?: '/';
        
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            
            if (preg_match($route['pattern'], $uri, $matches)) {
                // Extract named parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                // Run middleware
                foreach ($route['middleware'] as $middleware) {
                    $middlewareInstance = new $middleware();
                    $result = $middlewareInstance->handle();
                    if ($result === false) {
                        return;
                    }
                }
                
                // Call controller
                [$controllerClass, $action] = $route['handler'];
                $controller = new $controllerClass();
                $controller->$action($params);
                return;
            }
        }
        
        // 404 Not Found
        Response::json(['error' => 'Not found'], 404);
    }
}
