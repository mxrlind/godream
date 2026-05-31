'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2, ExternalLink } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useNotificationsStore } from '@/store/notifications.store';
import { cn, timeAgo } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  ACHIEVEMENT: '🏆',
  STREAK: '🔥',
  LEVEL_UP: '⚡',
  LESSON_COMPLETE: '✅',
  COURSE_COMPLETE: '🎓',
  NEW_MESSAGE: '💬',
  PAYMENT: '💳',
  PAYMENT_RECEIVED: '💰',
  SYSTEM: '📢',
  BADGE: '🎖️',
  MISSION_COMPLETE: '🎯',
  NEW_FOLLOWER: '👥',
  COMMENT_REPLY: '💬',
  COURSE_UPDATE: '📚',
  COURSE_APPROVED: '✅',
};

export function NotificationsPage() {
  const qc = useQueryClient();
  const { setNotifications, notifications, unreadCount, markAllRead } = useNotificationsStore();

  const { isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => {
      const res = await apiGet<any>('/notifications?limit=50');
      const list: Notification[] = (res as any)?.data ?? res ?? [];
      setNotifications(list);
      return list;
    },
    staleTime: 10_000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiPatch('/notifications/read-all', {}),
    onMutate: () => markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <Bell size={22} className="text-neon-cyan" />
            Notificações
          </h1>
          <p className="text-sm text-text-dim mt-0.5">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="btn btn-ghost gap-1.5 text-sm"
          >
            {markAllMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Marcar tudo como lido
          </motion.button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-16 text-center"
        >
          <Bell size={40} className="mx-auto text-text-muted mb-4 opacity-30" />
          <p className="text-text-secondary font-semibold">Nenhuma notificação</p>
          <p className="text-text-dim text-sm mt-1">Você está em dia!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Não lidas ({unread.length})
              </p>
              <div className="space-y-1.5">
                {unread.map((n, i) => (
                  <NotificationCard key={n.id} notification={n} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Lidas ({read.length})
              </p>
              <div className="space-y-1.5">
                {read.map((n, i) => (
                  <NotificationCard key={n.id} notification={n} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCard({ notification: n, index }: { notification: Notification; index: number }) {
  const icon = TYPE_ICONS[n.type] || '🔔';

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'card p-4 flex items-start gap-4 transition-colors',
        !n.isRead && 'bg-neon-purple/5 border-neon-purple/20',
        n.actionUrl && 'cursor-pointer hover:border-neon-purple/30',
      )}
    >
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5',
        n.isRead ? 'bg-surface-3' : 'bg-neon-purple/15 border border-neon-purple/20',
      )}>
        {n.imageUrl ? (
          <img src={n.imageUrl} alt="" className="w-full h-full rounded-xl object-cover" />
        ) : (
          icon
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-semibold leading-tight',
            n.isRead ? 'text-text-secondary' : 'text-text-primary',
          )}>
            {n.title}
          </p>
          {n.actionUrl && <ExternalLink size={13} className="text-text-muted flex-shrink-0 mt-0.5" />}
        </div>
        <p className="text-xs text-text-dim mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-[11px] text-text-muted mt-1.5">{timeAgo(n.createdAt)}</p>
      </div>

      {!n.isRead && (
        <div className="w-2 h-2 rounded-full bg-neon-magenta flex-shrink-0 mt-2.5" />
      )}
    </motion.div>
  );

  if (n.actionUrl) {
    return <Link href={n.actionUrl}>{inner}</Link>;
  }

  return inner;
}
