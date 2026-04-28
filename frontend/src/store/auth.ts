import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthCustomer = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
};

interface AuthState {
  token: string | null;
  customer: AuthCustomer | null;
  setSession: (token: string, customer: AuthCustomer) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      setSession: (token, customer) => set({ token, customer }),
      logout: () => set({ token: null, customer: null }),
    }),
    { name: 'raylabs-auth' },
  ),
);
