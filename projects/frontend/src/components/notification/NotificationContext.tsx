'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/configurations/config/socket';
import { toast } from 'react-hot-toast';

import { Notification } from '@/components/notification/notificationCard'; // Adjust path

// 1. Define the context type with all functions AND hasMore
interface NotificationContextType {
  notifications: Notification[];
  notifCount: number;
  markRead: (notificationId: number) => void;
  loadMore: () => void;
  reloadNotifications: () => void;
  hasMore: boolean; // <-- ADD THIS
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationPayload {
  limit: number;
  offset: number;
}

// Define your page size as a constant
const PAGE_LIMIT = 10;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true); // <-- 2. ADD THIS STATE
  const socketRef = useRef<Socket | null>(null);
  const offsetRef = useRef<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to notification server');
      getNotifications(PAGE_LIMIT, 0); // Load initial data
    });

    socket.on('new_notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setNotifCount((prev) => prev + 1);
      const blockedPaths = ['/login', '/notification'];
      const isOnBlockedPage = blockedPaths.some((path) =>
        pathname.startsWith(path)
      );
      if (!isOnBlockedPage) {
        toast.success(notif.title || 'New Notification!', {
          icon: '🔔',
        });
      }
    });

    socket.on(
      'notification_updated',
      ({ notificationId, read }: { notificationId: number; read: boolean }) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read } : n))
        );
      }
    );

    // --- 3. THIS LISTENER IS UPDATED ---
    socket.on('notifications_page', (notifs: Notification[]) => {
      if (offsetRef.current === 0) {
        // This was a RELOAD
        setNotifications(notifs);
        // Reset 'hasMore'. We assume there's more *unless* the first page
        // already has less than the limit.
        setHasMore(notifs.length === PAGE_LIMIT);
      } else {
        // This was a LOAD MORE
        setNotifications((prev) => [...prev, ...notifs]);
        // If the page we just got has less than the limit, we're at the end.
        if (notifs.length < PAGE_LIMIT) {
          setHasMore(false);
        }
      }
    });
    // ----------------------------------------

    socket.on('error', (err: string) => {
      console.log('Socket error:', err);
    });

    return () => {
      socket.disconnect();
    };
  }, [pathname]);

  const markRead = (notificationId: number) => {
    socketRef.current?.emit('mark_read', { notificationId });
    const notif = notifications.find((n) => n.id === notificationId);
    if (notif && !notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setNotifCount((prev) => Math.max(prev - 1, 0));
    }
  };

  const getNotifications = (limit: number, offset: number) => {
    // We set the ref *right before* we ask the server
    offsetRef.current = offset;
    const payload: NotificationPayload = { limit, offset };
    socketRef.current?.emit('get_notifications', payload);
  };

  const loadMore = () => {
    // Only try to load more if we think there is more
    if (hasMore) {
      getNotifications(PAGE_LIMIT, notifications.length);
    }
  };

  const reloadNotifications = () => {
    getNotifications(PAGE_LIMIT, 0); // This will set offsetRef.current = 0
  };

  // --- 4. EXPOSE 'hasMore' IN THE VALUE ---
  const value = {
    notifications,
    notifCount,
    markRead,
    loadMore,
    reloadNotifications,
    hasMore, // <-- ADD THIS
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}