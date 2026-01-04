import { StoreCollectionsRes, ProductCollection, StoreCollectionRes } from '../types/collection';

const MEDUSA_API_URL = process.env.EXPO_PUBLIC_MEDUSA_API_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY || '';

class CollectionService {
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

  async getCollections(): Promise<ProductCollection[]> {
    const data = await this.request<StoreCollectionsRes>('/store/collections');
    return data.collections;
  }

  async getCollection(id: string): Promise<ProductCollection> {
    const data = await this.request<StoreCollectionRes>(`/store/collections/${id}`);
    return data.collection;
  }
}

export const collectionService = new CollectionService();
