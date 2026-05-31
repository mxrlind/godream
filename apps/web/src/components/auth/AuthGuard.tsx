'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'CREATOR' | 'ADMIN' | 'MODERATOR';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken || !user) {
      router.replace('/auth/login');
      return;
    }
    if (requiredRole) {
      const isAdmin = user.role === 'ADMIN';
      const roleMatch = user.role === requiredRole;
      // Creators can have role STUDENT but isCreator=true — allow them into creator area
      const isCreatorAccess = requiredRole === 'CREATOR' && (user.isCreator || user.role === 'CREATOR');
      if (!isAdmin && !roleMatch && !isCreatorAccess) {
        router.replace('/dashboard');
      }
    }
  }, [isHydrated, accessToken, user, requiredRole, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
          <p className="text-text-muted text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !user) return null;

  return <>{children}</>;
}
