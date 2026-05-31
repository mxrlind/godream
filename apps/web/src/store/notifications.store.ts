import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Notification } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
}

interface NotificationsActions {
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useNotificationsStore = create<NotificationsState & NotificationsActions>()(
  immer((set) => ({
    notifications: [],
    unreadCount: 0,
    isOpen: false,

    setNotifications: (notifications) =>
      set((state) => {
        state.notifications = notifications;
        state.unreadCount = notifications.filter((n) => !n.isRead).length;
      }),

    setUnreadCount: (count) =>
      set((state) => {
        state.unreadCount = count;
      }),

    markRead: (id) =>
      set((state) => {
        const n = state.notifications.find((n) => n.id === id);
        if (n && !n.isRead) {
          n.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      }),

    markAllRead: () =>
      set((state) => {
        state.notifications.forEach((n) => (n.isRead = true));
        state.unreadCount = 0;
      }),

    addNotification: (notification) =>
      set((state) => {
        state.notifications.unshift(notification);
        if (!notification.isRead) state.unreadCount += 1;
      }),

    setOpen: (open) => set((state) => { state.isOpen = open; }),
    toggle: () => set((state) => { state.isOpen = !state.isOpen; }),
  })),
);
