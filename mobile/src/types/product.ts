export interface ProductOption {
  id: string;
  title: string;
  values: {
    id: string;
    value: string;
  }[];
}

export interface ProductVariant {
  id: string;
  title: string;
  prices: {
    amount: number;
    currency_code: string;
  }[];
  options: {
    option_id: string;
    value: string;
  }[];
  inventory_quantity: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  handle: string;
  thumbnail?: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  collection_id?: string;
  // Custom fields often added in Medusa or metadata
  metadata?: Record<string, any>;
}

export interface StoreProductsRes {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

export interface StoreProductRes {
  product: Product;
}
