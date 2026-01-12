import { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

// Sample notifications - in production these would come from API
const sampleNotifications: Notification[] = [
  {
    id: '1',
    message: 'Invoice #INV-001 has been paid by Acme Corp.',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    read: false,
    type: 'success',
  },
  {
    id: '2',
    message: 'Payment reminder sent to Tech Solutions.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
    type: 'info',
  },
  {
    id: '3',
    message: 'Invoice #INV-003 is overdue by 5 days.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    type: 'warning',
  },
  {
    id: '4',
    message: 'New client "StartupXYZ" has been added.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
    type: 'info',
  },
  {
    id: '5',
    message: 'Monthly revenue report is ready to download.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    read: true,
    type: 'success',
  },
];

const NOTIFICATIONS_KEY = 'ieosuia_notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage or use samples
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        setNotifications(sampleNotifications);
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(sampleNotifications));
      }
    } else {
      setNotifications(sampleNotifications);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(sampleNotifications));
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATIONS_KEY);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    clearNotifications,
  };
}
