import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) =>
        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
        }),

      updateUser: (partial) =>
        set((state) => {
          if (state.user) Object.assign(state.user, partial);
        }),

      clearAuth: () =>
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
        }),

      setLoading: (loading) => set((state) => { state.isLoading = loading; }),
      setHydrated: () => set((state) => { state.isHydrated = true; }),
    })),
    {
      name: 'godream:auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
