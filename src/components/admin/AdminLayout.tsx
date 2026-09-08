import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { getAdminToken, removeAdminToken } from "@/services/adminAuth";
import api from "@/services/api";

const ADMIN_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate('/guymhan/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const expireSession = () => {
      const token = getAdminToken();
      if (token) {
        void api.post('/guymhan/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => undefined);
      }
      removeAdminToken();
      setIsAuthenticated(false);
      navigate('/guymhan/login', { replace: true });
    };
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(expireSession, ADMIN_IDLE_TIMEOUT_MS);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="ml-0 pb-24 lg:ml-64 lg:pb-0 transition-all duration-300 min-w-0">
        {children}
      </div>
    </div>
  );
}
