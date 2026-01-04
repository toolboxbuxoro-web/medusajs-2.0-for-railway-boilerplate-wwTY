import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart } from '../types/cart';

interface CartStore {
  cartId: string | null;
  cart: Cart | null;
  loading: boolean;

  setCart: (cart: Cart | null) => void;
  setCartId: (id: string | null) => void;
  setLoading: (v: boolean) => void;
  resetCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartId: null,
      cart: null,
      loading: false,

      setCart: (cart) => set({ cart }),
      setCartId: (id) => set({ cartId: id }),
      setLoading: (v) => set({ loading: v }),
      resetCart: () => set({ cartId: null, cart: null }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        cartId: state.cartId,
        cart: state.cart 
      }), // Persist cartId and cart snapshot
    }
  )
);
