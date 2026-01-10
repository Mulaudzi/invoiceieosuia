import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PlanType } from '@/lib/types';
import { authService, getToken, removeToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, plan?: PlanType, recaptchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid or expired, clear it
          removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, recaptchaToken?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: loggedInUser } = await authService.login(email, password, recaptchaToken);
      setUser(loggedInUser);
      return { success: true };
    } catch (error) {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
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
