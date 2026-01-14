import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Check if we have a token in localStorage - this prevents redirect flicker during initial load
  const hasToken = !!getToken();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Only redirect to login if both user state is null AND no token exists
  // This prevents redirect during the brief moment before AuthContext initializes
  if (!user && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but no user yet, show loading (user will be fetched by AuthContext)
  if (!user && hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Check email verification if required
  if (requireVerified && user && !user.emailVerified) {
    return <Navigate to="/verify-email-reminder" replace />;
  }

  return <>{children}</>;
}
