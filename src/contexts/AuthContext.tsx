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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        // First, check localStorage for cached user (for immediate state)
        const cachedUser = localStorage.getItem('auth_user');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
            console.log('AuthContext: Loaded cached user:', parsed?.email);
          } catch {
            // Invalid cached user, will fetch from API
            console.log('AuthContext: Invalid cached user, fetching from API');
          }
        }
        
        try {
          // Validate token and get fresh user data with timeout
          console.log('AuthContext: Fetching current user from API...');
          const currentUser = await withTimeout(authService.getCurrentUser(), 10000);
          console.log('AuthContext: User fetched successfully:', currentUser?.email);
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        } catch (error) {
          // Token is invalid, expired, or request timed out
          console.error('AuthContext: Failed to fetch user:', error);
          
          // If we have a cached user and the error is a timeout, keep using cached
          if (cachedUser && error instanceof Error && error.message === 'Request timeout') {
            console.log('AuthContext: Using cached user due to timeout');
            toast({
              title: "Connection slow",
              description: "Using cached session. Some data may be outdated.",
              variant: "default",
            });
          } else {
            // Clear auth state for other errors (invalid token, 401, etc.)
            console.log('AuthContext: Clearing auth state');
            removeToken();
            localStorage.removeItem('auth_user');
            setUser(null);
          }
        }
      } else {
        console.log('AuthContext: No token found');
      }
      setIsLoading(false);
    };

    initAuth();
  }, [toast]);

  const login = async (email: string, password: string, recaptchaToken?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('AuthContext: Starting login for:', email);
      const { user: loggedInUser, token } = await authService.login(email, password, recaptchaToken);
      console.log('AuthContext: Login successful, setting user:', loggedInUser?.email);
      // Set user in state AND localStorage for persistence
      setUser(loggedInUser);
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
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
