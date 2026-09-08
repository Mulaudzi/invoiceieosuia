import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/lib/types';
import { authService, getToken, removeToken, setToken } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.debug(...args);
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout wrapper for API calls
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage synchronously to prevent flash
    const cachedUser = localStorage.getItem('auth_user');
    const token = getToken();
    if (cachedUser && token) {
      try {
        return JSON.parse(cachedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Only show loading if we have a token but need to validate
    const token = getToken();
    const cachedUser = localStorage.getItem('auth_user');
    // If we have both token and cached user, don't show loading initially
    return token ? !cachedUser : false;
  });
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Skip if already initialized or user was set by login/OAuth
    if (authInitialized) {
      debugLog('AuthContext: Already initialized, skipping initAuth');
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      const centralToken = new URLSearchParams(window.location.hash.slice(1)).get('ieosuia_token');
      if (centralToken) {
        setToken(centralToken);
        localStorage.removeItem('auth_user');
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
      const token = getToken();
      
      if (!token) {
        debugLog('AuthContext: No token found');
        if (isMounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
        return;
      }

      // If we already have a user (from login or cache), use it immediately
      if (user) {
        debugLog('AuthContext: User already set');
        if (isMounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
        
        // Background validation - don't block UI, with timeout
        const validateInBackground = async () => {
          try {
            debugLog('AuthContext: Background validating user...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const currentUser = await authService.getCurrentUser();
            clearTimeout(timeoutId);
            
            debugLog('AuthContext: User validated');
            if (isMounted) {
              setUser(currentUser);
              localStorage.setItem('auth_user', JSON.stringify(currentUser));
            }
          } catch (error) {
            console.error('AuthContext: Background validation failed:', error);
            // Silently fail in background - don't clear auth on timeout
            if (error instanceof Error && error.message.includes('timeout')) {
              debugLog('AuthContext: Background validation timeout - keeping cached user');
              return;
            }
            // Only clear on actual auth errors (401), not on timeout
            if (isMounted && error instanceof Error && !error.message.includes('timeout')) {
              debugLog('AuthContext: Clearing auth state due to validation failure');
              removeToken();
              localStorage.removeItem('auth_user');
              setUser(null);
            }
          }
        };
        
        validateInBackground();
        return;
      }

      // No cached user but have token - must fetch with timeout
      try {
        debugLog('AuthContext: Fetching current user from API...');
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 5000)
        );
        
        const userFetch = authService.getCurrentUser();
        const currentUser = await Promise.race([userFetch, timeoutPromise]) as any;
        
        debugLog('AuthContext: User fetched successfully');
        if (isMounted) {
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        }
      } catch (error) {
        console.error('AuthContext: Failed to fetch user:', error);
        
        if (error instanceof Error && error.message.includes('timeout')) {
          debugLog('AuthContext: Timeout fetching user - showing error');
          if (isMounted) {
            toast({
              title: "Connection slow",
              description: "Unable to verify session. Please try again.",
              variant: "destructive",
            });
          }
        }
        // Clear auth state on error
        debugLog('AuthContext: Clearing auth state');
        if (isMounted) {
          removeToken();
          localStorage.removeItem('auth_user');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [toast, authInitialized]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      debugLog('AuthContext: Starting login');
      const { user: loggedInUser, token } = await authService.login(email, password);
      debugLog('AuthContext: Login successful, setting user');
      // Set user in state AND localStorage for persistence
      setUser(loggedInUser);
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
      // Mark as initialized and not loading - we have a valid user
      setAuthInitialized(true);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: newUser } = await authService.register(name, email, password);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (data: Partial<User>): Promise<void> => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    const token = getToken();
    if (!token) {
      debugLog('No token found, cannot refresh user');
      return;
    }
    
    try {
      debugLog('Refreshing user data...');
      const currentUser = await authService.getCurrentUser();
      debugLog('User refreshed');
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, clear it
      removeToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
