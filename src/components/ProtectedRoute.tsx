import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getToken, removeToken } from '@/services/api';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const MAX_LOADING_TIME = 8000; // 8 seconds max wait

export function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasToken = !!getToken();

  // Debug logging
  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isLoading, 
      hasToken, 
      hasUser: !!user, 
      userEmail: user?.email,
      loadingTimedOut,
      path: location.pathname 
    });
  }, [isLoading, hasToken, user, loadingTimedOut, location.pathname]);

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

    // Only set timeout if we're in a loading state
    if (isLoading && hasToken && !user) {
      console.log('ProtectedRoute: Starting loading timeout...');
      timeoutRef.current = setTimeout(() => {
        console.log('ProtectedRoute: Loading timed out after', MAX_LOADING_TIME, 'ms');
        setLoadingTimedOut(true);
        // Clear token on timeout to prevent infinite loop
        removeToken();
        localStorage.removeItem('auth_user');
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

  // Timed out without user - redirect to login
  if (loadingTimedOut) {
    console.log('ProtectedRoute: Timed out, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // No token and no user - redirect to login
  if (!hasToken && !isLoading) {
    console.log('ProtectedRoute: No token, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Loading state - show spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
        <p className="mt-4 text-muted-foreground text-sm">
          {isLoading ? 'Verifying session...' : 'Loading your session...'}
        </p>
      </div>
    </div>
  );
}
