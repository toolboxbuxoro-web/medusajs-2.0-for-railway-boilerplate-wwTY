export interface Product {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  metadata: {
    title_ru?: string;
    title_uz?: string;
    description_ru?: string;
    description_uz?: string;
    [key: string]: any;
  };
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  inventory_quantity: number;
  prices: Price[];
}

export interface Price {
  id: string;
  currency_code: string;
  amount: number;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
  description?: string;
  metadata: {
    title_ru?: string;
    title_uz?: string;
    [key: string]: any;
  };
  category_children: Category[];
}

export interface Cart {
  id: string;
  items: CartItem[];
  shipping_methods: any[];
  payment_sessions: any[];
  metadata: Record<string, any>;
}

export interface CartItem {
  id: string;
  title: string;
  thumbnail: string;
  quantity: number;
  unit_price: number;
  variant: ProductVariant;
}
