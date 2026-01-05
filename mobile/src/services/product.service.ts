import { Product, StoreProductRes, StoreProductsRes } from '../types/product';

const MEDUSA_API_URL = process.env.EXPO_PUBLIC_MEDUSA_API_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY || '';

class ProductService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${MEDUSA_API_URL}${endpoint}`;
    
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

  async getProducts(queryParams?: string): Promise<Product[]> {
    // Medusa 2.0 requires region_id for pricing
    // Uzbekistan Region ID from API
    const REGION_ID = 'reg_01KAY0QXWMQSDRYZRGRCKE0GAN';
    
    // Storefront pattern for Medusa 2.0 pricing and inventory
    const fields = '*variants.calculated_price,+variants.inventory_quantity,+metadata,+images';
    
    const params = new URLSearchParams(queryParams || '');
    params.set('fields', fields);
    params.set('region_id', REGION_ID);
    
    const endpoint = `/store/products?${params.toString()}`;
    const data = await this.request<StoreProductsRes>(endpoint);
    
    if (data.products.length > 0 && __DEV__) {
        const p = data.products[0];
        console.log('[ProductService] Check:', {
            title: p.title,
            variantId: p.variants?.[0]?.id,
            hasPrice: !!p.variants?.[0]?.calculated_price,
            amount: p.variants?.[0]?.calculated_price?.calculated_amount,
            inventory: p.variants?.[0]?.inventory_quantity
        });
    }

    return data.products;
  }

  async getProduct(id: string): Promise<Product> {
    const REGION_ID = 'reg_01KAY0QXWMQSDRYZRGRCKE0GAN';
    const fields = '*variants.calculated_price,+variants.inventory_quantity,+metadata,+images';
    const endpoint = `/store/products/${id}?region_id=${REGION_ID}&fields=${fields}`;
    const data = await this.request<StoreProductRes>(endpoint);
    return data.product;
  }
}

export const productService = new ProductService();
