import * as SecureStore from 'expo-secure-store';
import { Customer } from '../store/auth-store';

const MEDUSA_API_URL = process.env.EXPO_PUBLIC_MEDUSA_API_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY || '';
const TOKEN_KEY = 'auth_token';

class AuthService {
  private async getHeaders() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      ...(PUBLISHABLE_KEY && { 'x-publishable-api-key': PUBLISHABLE_KEY }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${MEDUSA_API_URL}${endpoint}`;
    const headers = {
      ...(await this.getHeaders()),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Error ${response.status}`);
    }

    return response.json();
  }

  async requestOtp(phone: string): Promise<boolean> {
    const data = await this.request<{ success: boolean }>('/store/mobile/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return data.success;
  }

  async verifyOtp(phone: string, code: string, cartId?: string): Promise<{ token: string, customer: Customer }> {
    const data = await this.request<{ token: string, customer: Customer }>('/store/mobile/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, cart_id: cartId }),
    });

    if (data.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    }

    return data;
  }

  async getMe(): Promise<Customer> {
    const data = await this.request<{ customer: Customer }>('/store/mobile/auth/me');
    return data.customer;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/store/mobile/auth/logout', { method: 'POST' });
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
}

export const authService = new AuthService();
