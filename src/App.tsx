import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import CentralAuthRedirect from "@/components/auth/CentralAuthRedirect";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Clients = lazy(() => import("./pages/Clients"));
const Products = lazy(() => import("./pages/Products"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Templates = lazy(() => import("./pages/Templates"));
const Settings = lazy(() => import("./pages/Settings"));
const RecurringInvoices = lazy(() => import("./pages/RecurringInvoices"));
const Profile = lazy(() => import("./pages/Profile"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const VerifyEmailReminder = lazy(() => import("./pages/VerifyEmailReminder"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const PopiaCompliance = lazy(() => import("./pages/PopiaCompliance"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Careers = lazy(() => import("./pages/Careers"));
const FAQ = lazy(() => import("./pages/FAQ"));
const AdminIndex = lazy(() => import("./pages/admin/AdminIndex"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminEmailLogs = lazy(() => import("./pages/admin/AdminEmailLogs"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen grid place-items-center" role="status">Loading…</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<CentralAuthRedirect />} />
              <Route path="/register" element={<CentralAuthRedirect mode="signup" />} />
              <Route path="/auth/callback" element={<CentralAuthRedirect callback />} />
              <Route path="/guymhan/auth/callback" element={<CentralAuthRedirect mode="admin" callback />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/popia-compliance" element={<PopiaCompliance />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/guymhan-setup" element={<AdminSetup />} />
              
              {/* Admin Routes */}
              <Route path="/guymhan" element={<AdminIndex />} />
              <Route path="/guymhan/login" element={<CentralAuthRedirect mode="admin" />} />
              <Route path="/guymhan/dashboard" element={<AdminDashboard />} />
              <Route path="/guymhan/submissions" element={<AdminSubmissions />} />
              <Route path="/guymhan/submissions/:id" element={<AdminSubmissions />} />
              <Route path="/guymhan/email-logs" element={<AdminEmailLogs />} />
              <Route path="/guymhan/settings" element={<AdminSettings />} />
              <Route path="/guymhan/users" element={<AdminUsers />} />
              <Route path="/guymhan/activity-logs" element={<AdminActivityLogs />} />
              <Route path="/guymhan/system" element={<AdminSystem />} />
              
              {/* Email Verification Reminder (requires auth but not verification) */}
              <Route path="/verify-email-reminder" element={<ProtectedRoute requireVerified={false}><VerifyEmailReminder /></ProtectedRoute>} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/dashboard/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/recurring" element={<ProtectedRoute><RecurringInvoices /></ProtectedRoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
