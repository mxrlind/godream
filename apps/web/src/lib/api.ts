import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach token ──────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — refresh on 401 ───────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` };
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh, user } = response.data.data;

        useAuthStore.getState().setAuth(user, accessToken, newRefresh);
        processQueue(null, accessToken);

        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${accessToken}` };
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed helpers ────────────────────────────────────────────
export const apiGet = <T>(url: string, params?: object) =>
  api.get<{ data: T }>(url, { params }).then((r) => r.data.data);

export const apiPost = <T>(url: string, data?: object) =>
  api.post<{ data: T }>(url, data).then((r) => r.data.data);

export const apiPut = <T>(url: string, data?: object) =>
  api.put<{ data: T }>(url, data).then((r) => r.data.data);

export const apiPatch = <T>(url: string, data?: object) =>
  api.patch<{ data: T }>(url, data).then((r) => r.data.data);

export const apiDelete = <T>(url: string) =>
  api.delete<{ data: T }>(url).then((r) => r.data.data);

export default api;
