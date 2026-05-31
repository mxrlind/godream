'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useNotificationsStore } from '@/store/notifications.store';
import { cn, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  ACHIEVEMENT: '🏆',
  LESSON_COMPLETE: '✅',
  COURSE_COMPLETE: '🎓',
  NEW_MESSAGE: '💬',
  PAYMENT: '💳',
  SYSTEM: '📢',
  BADGE: '🎖️',
  LEVEL_UP: '⚡',
  MISSION: '🎯',
  SOCIAL: '👥',
};

export function NotificationsBell() {
  const qc = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen, toggle, setOpen, setNotifications, notifications, unreadCount, markRead, markAllRead } =
    useNotificationsStore();

  // ─── Fetch notifications ───────────────────────────────────
  const { isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiGet<any>('/notifications?limit=20');
      const list: Notification[] = (res as any)?.data ?? res ?? [];
      setNotifications(list);
      return list;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // ─── Mark one as read ──────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`, {}),
    onMutate: (id) => markRead(id),
  });

  // ─── Mark all read ─────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: () => apiPatch('/notifications/read-all', {}),
    onMutate: () => markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // ─── Close on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className={cn(
          'btn btn-ghost btn-icon relative',
          isOpen && 'bg-surface-3 text-text-primary',
        )}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 8 }}
        >
          <Bell size={17} />
        </motion.div>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-neon-magenta flex items-center justify-center text-[9px] font-bold text-white px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 card overflow-hidden z-50"
            style={{ transformOrigin: 'top right' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-display font-bold text-sm text-text-primary">Notificações</span>
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                >
                  {markAllMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCheck size={13} />
                  )}
                  Marcar tudo como lido
                </motion.button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-text-muted" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
                  <p className="text-sm text-text-secondary font-medium">Nenhuma notificação</p>
                  <p className="text-xs text-text-dim mt-0.5">Você está em dia!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      index={i}
                      onRead={() => {
                        if (!n.isRead) markReadMutation.mutate(n.id);
                        if (n.actionUrl) setOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 text-xs text-text-dim hover:text-text-secondary transition-colors py-1"
              >
                Ver todas
                <ExternalLink size={11} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification: n,
  index,
  onRead,
}: {
  notification: Notification;
  index: number;
  onRead: () => void;
}) {
  const icon = TYPE_ICONS[n.type] || '🔔';

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onRead}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
        n.isRead
          ? 'hover:bg-surface-3/50'
          : 'bg-neon-purple/5 hover:bg-neon-purple/10',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5',
        n.isRead ? 'bg-surface-3' : 'bg-neon-purple/15 border border-neon-purple/20',
      )}>
        {n.imageUrl ? (
          <img src={n.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
        ) : (
          <span className="text-base">{icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold leading-tight', n.isRead ? 'text-text-secondary' : 'text-text-primary')}>
          {n.title}
        </p>
        <p className="text-[11px] text-text-dim mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div className="w-2 h-2 rounded-full bg-neon-magenta flex-shrink-0 mt-2" />
      )}
    </motion.div>
  );

  if (n.actionUrl) {
    return <Link href={n.actionUrl}>{content}</Link>;
  }

  return content;
}
