import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PlanType } from '@/lib/types';
import { userService, initializeMockData } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, plan?: PlanType) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize mock data on first load
    initializeMockData();
    
    // Check for existing session
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = userService.getByEmail(email);
    
    if (!foundUser) {
      return { success: false, error: 'No account found with this email' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }

    userService.setCurrentUser(foundUser);
    setUser(foundUser);
    return { success: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    plan: PlanType = 'free'
  ): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const existingUser = userService.getByEmail(email);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser = userService.create({
      name,
      email,
      password,
      plan,
    });

    userService.setCurrentUser(newUser);
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    userService.setCurrentUser(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    userService.setCurrentUser(updatedUser);
    setUser(updatedUser);
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
