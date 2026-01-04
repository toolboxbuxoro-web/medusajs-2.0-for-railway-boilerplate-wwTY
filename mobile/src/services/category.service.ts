const MEDUSA_API_URL = process.env.EXPO_PUBLIC_MEDUSA_API_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY || '';

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  metadata?: any;
}

interface StoreCategoriesRes {
  product_categories: ProductCategory[];
  count: number;
}

class CategoryService {
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

  async getCategories(queryParams: string = ''): Promise<ProductCategory[]> {
    const data = await this.request<StoreCategoriesRes>(`/store/product-categories${queryParams ? `?${queryParams}` : ''}`);
    return data.product_categories;
  }
}

export const categoryService = new CategoryService();
