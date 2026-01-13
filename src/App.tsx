import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Payments from "./pages/Payments";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Reminders from "./pages/Reminders";
import RecurringInvoices from "./pages/RecurringInvoices";
import NotificationHistory from "./pages/NotificationHistory";
import EmailTemplates from "./pages/EmailTemplates";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailReminder from "./pages/VerifyEmailReminder";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import PopiaCompliance from "./pages/PopiaCompliance";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Documentation from "./pages/Documentation";
import Careers from "./pages/Careers";
import FAQ from "./pages/FAQ";
import CookieConsent from "./components/CookieConsent";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminIndex from "./pages/admin/AdminIndex";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminEmailLogs from "./pages/admin/AdminEmailLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminQaConsole from "./pages/admin/AdminQaConsole";
import AdminSetup from "./pages/AdminSetup";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import QaConsole from "./pages/QaConsole";
import GoogleCallback from "./pages/GoogleCallback";

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
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/submissions" element={<AdminSubmissions />} />
              <Route path="/admin/submissions/:id" element={<AdminSubmissions />} />
              <Route path="/admin/email-logs" element={<AdminEmailLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/qa" element={<AdminQaConsole />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
              
              {/* Email Verification Reminder (requires auth but not verification) */}
              <Route path="/verify-email-reminder" element={<ProtectedRoute requireVerified={false}><VerifyEmailReminder /></ProtectedRoute>} />
              
              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/dashboard/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/dashboard/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
              <Route path="/dashboard/recurring" element={<ProtectedRoute><RecurringInvoices /></ProtectedRoute>} />
              <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationHistory /></ProtectedRoute>} />
              <Route path="/dashboard/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
              <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard/qa" element={<ProtectedRoute><QaConsole /></ProtectedRoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
