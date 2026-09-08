import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/services/api';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const MAX_LOADING_TIME = 6000; // 6 seconds max wait

export function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasToken = !!getToken();

  // Safety timeout - only when actually loading without a user
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If we have a user, no need for timeout
    if (user) {
      setLoadingTimedOut(false);
      return;
    }

    // Only set timeout if we're in a loading state AND have a token
    // This prevents timeout on fresh page loads without auth
    if (isLoading && hasToken && !user) {
      timeoutRef.current = setTimeout(() => {
        setLoadingTimedOut(true);
      }, MAX_LOADING_TIME);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, hasToken, user]);

  // User is authenticated - render children immediately
  if (user) {
    // Check email verification if required
    if (requireVerified && !user.emailVerified) {
      return <Navigate to="/verify-email-reminder" replace />;
    }
    return <>{children}</>;
  }

  // A timeout is a connectivity problem, not proof that the session is invalid.
  if (loadingTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">We could not verify your session</h1>
          <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again. Your session has not been cleared.</p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No token and not loading - redirect to login
  if (!hasToken && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Loading state - show spinner with timeout warning
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-muted-foreground text-sm">
          {isLoading ? 'Verifying session...' : 'Loading your session...'}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          If this takes more than a few seconds, try refreshing the page
        </p>
      </div>
    </div>
  );
}
