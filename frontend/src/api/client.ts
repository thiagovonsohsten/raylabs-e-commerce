import axios from 'axios';
import { useAuthStore } from '@/store/auth';

/**
 * Cliente HTTP com interceptor para anexar JWT do auth store.
 * Em 401, limpa o token e força re-login.
 */
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);
