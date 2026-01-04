import { create } from 'zustand';
import { Product } from '@/types/product';

interface FavoritesState {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  
  toggleFavorite: (product) => {
    const { favorites } = get();
    const exists = favorites.some((p) => p.id === product.id);

    if (exists) {
      set({ favorites: favorites.filter((p) => p.id !== product.id) });
    } else {
      set({ favorites: [...favorites, product] });
    }
  },

  isFavorite: (productId) => {
    return get().favorites.some((p) => p.id === productId);
  },

  clearFavorites: () => set({ favorites: [] }),
}));
