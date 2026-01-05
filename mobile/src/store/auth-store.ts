import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { track } from '../lib/analytics/track';
import { useCartStore } from './cart-store';

export interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  
  // Actions
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  
  // Internal state setters
  setCustomer: (customer: Customer | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand store for Authentication.
 * Handles persistence via AuthService (AsyncStorage) and real Medusa sessions.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  customer: null,
  isAuthenticated: false,
  loading: false,
  hydrated: false,

  setCustomer: (customer) => set({ 
    customer, 
    isAuthenticated: !!customer 
  }),
  
  setLoading: (loading) => set({ loading }),

  requestOtp: async (phone: string) => {
    set({ loading: true });
    try {
      await authService.requestOtp(phone);
      track('auth_request_otp', { phone });
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (phone: string, code: string) => {
    set({ loading: true });
    try {
      const cartId = useCartStore.getState().cartId || undefined;
      const { customer } = await authService.verifyOtp(phone, code, cartId);
      set({ 
        customer, 
        isAuthenticated: true,
        loading: false 
      });
      track('auth_verify_success', { phone });
    } catch (error) {
      set({ loading: false });
      track('auth_verify_failed', { phone, error: (error as Error).message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      track('auth_logout', {});
    } finally {
      set({ 
        customer: null, 
        isAuthenticated: false 
      });
    }
  },

  restoreSession: async () => {
    const token = await authService.getToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }

    try {
      const customer = await authService.getMe();
      set({ 
        customer, 
        isAuthenticated: true,
        hydrated: true 
      });
    } catch (error) {
      // Token probably expired
      await authService.logout();
      set({ hydrated: true });
    }
  },
}));
