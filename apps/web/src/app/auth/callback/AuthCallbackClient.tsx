'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';

export function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const syncGamification = useGamificationStore((s) => s.syncState);

  useEffect(() => {
    const token = params.get('token');
    const refresh = params.get('refresh');
    const error = params.get('error');

    if (error) {
      toast.error('Falha na autenticação OAuth');
      router.replace('/auth/login');
      return;
    }

    if (!token || !refresh) {
      router.replace('/auth/login');
      return;
    }

    useAuthStore.setState({ accessToken: token, refreshToken: refresh });

    apiGet<any>('/auth/me')
      .then((res) => {
        setAuth(res.user, token, refresh);
        if (res.gamification) syncGamification(res.gamification);
        toast.success(`Bem-vindo(a), ${res.user.name}! 🚀`);
        router.replace('/dashboard');
      })
      .catch(() => {
        toast.error('Erro ao carregar perfil');
        router.replace('/auth/login');
      });
  }, []);

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
        <p className="text-text-secondary text-sm font-medium">Autenticando...</p>
      </div>
    </div>
  );
}
