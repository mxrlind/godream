'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { XpBurstLayer } from '@/components/ui/xp-burst';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status === 401) return false;
        if (error?.response?.status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
};

function SocketProvider() {
  useNotificationsSocket();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));
  const { setHydrated, accessToken } = useAuthStore();

  useEffect(() => {
    setHydrated();
  }, [setHydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <XpBurstLayer />
      {accessToken && <SocketProvider />}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
