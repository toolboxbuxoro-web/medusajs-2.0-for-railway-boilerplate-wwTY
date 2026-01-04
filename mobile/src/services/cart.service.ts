import { Cart, StoreCartResponse } from '../types/cart';

const MEDUSA_API_URL = process.env.EXPO_PUBLIC_MEDUSA_API_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY || '';

class CartService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${MEDUSA_API_URL}${endpoint}`;
    
    // Medusa requires 'application/json' for most post/puts
    const headers = {
      'Content-Type': 'application/json',
      ...(PUBLISHABLE_KEY && { 'x-publishable-api-key': PUBLISHABLE_KEY }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Medusa API Error: ${response.status} ${JSON.stringify(errorBody)}`);
    }

    return response.json();
  }

  async createCart(regionId?: string): Promise<Cart> {
    const body = regionId ? { region_id: regionId } : {};
    const data = await this.request<StoreCartResponse>('/store/carts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.cart;
  }

  async getCart(cartId: string): Promise<Cart> {
    const data = await this.request<StoreCartResponse>(`/store/carts/${cartId}`);
    return data.cart;
  }

  async addItem(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    const data = await this.request<StoreCartResponse>(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
    });
    return data.cart;
  }

  async updateItem(cartId: string, lineItemId: string, quantity: number): Promise<Cart> {
    const data = await this.request<StoreCartResponse>(`/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
    return data.cart;
  }

  async removeItem(cartId: string, lineItemId: string): Promise<Cart> {
    const data = await this.request<StoreCartResponse>(`/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'DELETE',
    });
    return data.cart;
  }

  async updateCart(cartId: string, updates: {
    shipping_address?: {
      first_name: string;
      last_name?: string;
      phone: string;
      address_1: string;
      city: string;
      country_code: string;
      postal_code?: string;
    };
    email?: string;
  }): Promise<Cart> {
    const data = await this.request<StoreCartResponse>(`/store/carts/${cartId}`, {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    return data.cart;
  }

  async complete(cartId: string): Promise<import('../types/cart').Order> {
    const data = await this.request<import('../types/cart').StoreCompleteCartRes>(`/store/carts/${cartId}/complete`, {
      method: 'POST',
    });
    
    if (data.type !== 'order') {
       throw new Error('Cart completion did not return an order. Is payment required?');
    }

    return data.data;
  }
}

export const cartService = new CartService();
