export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StoreCollectionsRes {
  collections: ProductCollection[];
  count: number;
  offset: number;
  limit: number;
}

export interface StoreCollectionRes {
  collection: ProductCollection;
}
