import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/services/api';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const MAX_LOADING_TIME = 15000; // 15 seconds max wait

export function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Check if we have a token in localStorage - this prevents redirect flicker during initial load
  const hasToken = !!getToken();

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading || (!user && hasToken)) {
      const timeout = setTimeout(() => {
        console.log('ProtectedRoute: Loading timed out after', MAX_LOADING_TIME, 'ms');
        setLoadingTimedOut(true);
      }, MAX_LOADING_TIME);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, hasToken]);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', { isLoading, hasToken, hasUser: !!user, loadingTimedOut });
  }, [isLoading, hasToken, user, loadingTimedOut]);

  // If loading timed out, redirect to login
  if (loadingTimedOut && !user) {
    console.log('ProtectedRoute: Timed out without user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">Verifying session...</p>
        </div>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  // Check email verification if required
  if (requireVerified && user && !user.emailVerified) {
    return <Navigate to="/verify-email-reminder" replace />;
  }

  return <>{children}</>;
}
