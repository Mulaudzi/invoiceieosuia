import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/dashboard/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
