import { useState, useEffect, useCallback } from 'react';
import api, { getToken } from '@/services/api';

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedType?: string;
  relatedId?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
      // Don't clear existing notifications on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await api.post('/notifications/mark-all-read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Revert on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const clearNotifications = useCallback(async () => {
    // Optimistic update
    const previousNotifications = notifications;
    setNotifications([]);

    try {
      await api.delete('/notifications');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      // Revert on error
      setNotifications(previousNotifications);
    }
  }, [notifications]);

  const refetch = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    refetch,
  };
}