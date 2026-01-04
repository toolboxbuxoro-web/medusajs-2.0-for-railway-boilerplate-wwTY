export interface LineItem {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  variant_id: string;
  variant: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
      thumbnail: string;
    };
  };
  total: number;
}

export interface Cart {
  id: string;
  region_id?: string;
  email?: string;
  items: LineItem[];
  subtotal: number;
  total: number;
  currency_code: string;
}

export interface StoreCartResponse {
  cart: Cart;
}

export interface Order {
  id: string;
  display_id: number;
  cart_id: string;
  email: string;
  total: number;
  currency_code: string;
  created_at: string;
  // Add other order fields as needed
}

export interface StoreCompleteCartRes {
  type: 'order';
  data: Order;
}
