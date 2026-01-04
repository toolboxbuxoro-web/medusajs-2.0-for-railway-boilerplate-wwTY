import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartMutationBase =
  | { type: 'add'; variantId: string; quantity: number }
  | { type: 'update'; lineItemId: string; quantity: number }
  | { type: 'remove'; lineItemId: string };

export type CartMutation = CartMutationBase & { timestamp: number };

interface CartQueueState {
  queue: CartMutation[];
  enqueue: (m: CartMutationBase) => void;
  dequeue: () => CartMutation | undefined;
  peek: () => CartMutation | undefined;
  clear: () => void;
}

export const useCartQueueStore = create<CartQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      enqueue: (m) => {
        const mutationWithTimestamp = { ...m, timestamp: Date.now() } as CartMutation;
        set({ queue: [...get().queue, mutationWithTimestamp] });
      },

      peek: () => {
        return get().queue[0];
      },

      dequeue: () => {
        const [first, ...rest] = get().queue;
        set({ queue: rest });
        return first;
      },

      clear: () => set({ queue: [] }),
    }),
    {
      name: 'cart-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
