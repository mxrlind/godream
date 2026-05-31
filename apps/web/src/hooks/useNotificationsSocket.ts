'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useGamificationStore } from '@/store/gamification.store';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Notification } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useNotificationsSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { addNotification, setUnreadCount } = useNotificationsStore();
  const { syncState, setBpTier } = useGamificationStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${API_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Notifications connected');
    });

    socket.on('disconnect', () => {
      console.log('[WS] Notifications disconnected');
    });

    // New notification pushed from server
    socket.on('notification', (data: Notification) => {
      addNotification(data);
      toast(data.title, {
        icon: '🔔',
        duration: 4000,
        style: { background: '#1a1a2e', color: '#e2e8f0', border: '1px solid rgba(124,92,255,0.3)' },
      });
    });

    // XP award event
    socket.on('xp_award', (data: { xp: number; reason: string }) => {
      toast(`+${data.xp} XP — ${data.reason}`, {
        icon: '⚡',
        duration: 3000,
        style: { background: '#1a1a2e', color: '#7c5cff', border: '1px solid rgba(124,92,255,0.3)' },
      });
    });

    // Level up event
    socket.on('level_up', (data: { level: number }) => {
      toast.success(`🎉 Subiu para nível ${data.level}!`, {
        duration: 5000,
        style: { background: '#1a1a2e', color: '#ffd166', border: '1px solid rgba(255,209,102,0.4)' },
      });
    });

    // Streak update event
    socket.on('streak_update', (data: { streak: number; isNewRecord: boolean }) => {
      syncState({ streak: data.streak });
      qc.invalidateQueries({ queryKey: ['streak-history'] });
      if (data.streak > 1) {
        toast(`🔥 ${data.streak} dias seguidos!${data.isNewRecord ? ' Novo recorde!' : ''}`, {
          duration: 4000,
          style: { background: '#1a1a2e', color: '#ff7a18', border: '1px solid rgba(255,122,24,0.3)' },
        });
      }
    });

    // Battle pass tier advance
    socket.on('battle_pass_tier', (data: { tier: number }) => {
      setBpTier(data.tier);
      qc.invalidateQueries({ queryKey: ['battle-pass'] });
      toast(`👑 Battle Pass Tier ${data.tier} alcançado!`, {
        duration: 4000,
        style: { background: '#1a1a2e', color: '#ffd166', border: '1px solid rgba(255,209,102,0.3)' },
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, addNotification, setUnreadCount]);

  return socketRef;
}
