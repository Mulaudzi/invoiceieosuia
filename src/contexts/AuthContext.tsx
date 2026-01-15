import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, PlanType } from '@/lib/types';
import { authService, getToken, removeToken, setToken } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, plan?: PlanType, recaptchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromOAuth: (user: User) => void;
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
      console.log('AuthContext: Already initialized, skipping initAuth');
      return;
    }

    const initAuth = async () => {
      const token = getToken();
      
      if (!token) {
        console.log('AuthContext: No token found');
        setIsLoading(false);
        setAuthInitialized(true);
        return;
      }

      // If we already have a user (from login or cache), just validate in background
      if (user) {
        console.log('AuthContext: User already set:', user.email);
        setIsLoading(false);
        setAuthInitialized(true);
        
        // Background validation - don't block UI
        try {
          console.log('AuthContext: Background validating user...');
          const currentUser = await withTimeout(authService.getCurrentUser(), 10000);
          console.log('AuthContext: User validated:', currentUser?.email);
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        } catch (error) {
          console.error('AuthContext: Background validation failed:', error);
          // Only clear on auth errors (401), not on timeout
          if (error instanceof Error && error.message !== 'Request timeout') {
            console.log('AuthContext: Clearing auth state due to validation failure');
            removeToken();
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        }
        return;
      }

      // No cached user but have token - must fetch
      try {
        console.log('AuthContext: Fetching current user from API...');
        const currentUser = await withTimeout(authService.getCurrentUser(), 10000);
        console.log('AuthContext: User fetched successfully:', currentUser?.email);
        setUser(currentUser);
        localStorage.setItem('auth_user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('AuthContext: Failed to fetch user:', error);
        
        if (error instanceof Error && error.message === 'Request timeout') {
          console.log('AuthContext: Timeout - showing error');
          toast({
            title: "Connection slow",
            description: "Unable to verify session. Please try again.",
            variant: "destructive",
          });
        }
        // Clear auth state
        console.log('AuthContext: Clearing auth state');
        removeToken();
        localStorage.removeItem('auth_user');
        setUser(null);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    initAuth();
  }, [toast, user, authInitialized]);

  const login = async (email: string, password: string, recaptchaToken?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('AuthContext: Starting login for:', email);
      const { user: loggedInUser, token } = await authService.login(email, password, recaptchaToken);
      console.log('AuthContext: Login successful, setting user:', loggedInUser?.email);
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
    password: string,
    plan: PlanType = 'free',
    recaptchaToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: newUser } = await authService.register(name, email, password, plan, recaptchaToken);
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
      console.log('No token found, cannot refresh user');
      return;
    }
    
    try {
      console.log('Refreshing user data...');
      const currentUser = await authService.getCurrentUser();
      console.log('User refreshed:', currentUser?.email);
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, clear it
      removeToken();
      setUser(null);
    }
  }, []);

  // Direct setter for OAuth flow (avoids race conditions)
  const setUserFromOAuth = useCallback((oauthUser: User): void => {
    console.log('Setting user from OAuth:', oauthUser?.email);
    setUser(oauthUser);
    localStorage.setItem('auth_user', JSON.stringify(oauthUser));
    setAuthInitialized(true);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, refreshUser, setUserFromOAuth }}>
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
