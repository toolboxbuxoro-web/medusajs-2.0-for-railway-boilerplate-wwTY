import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '../store/cart-store';
import { useCartQueueStore } from '../store/cart-queue.store';
import { cartQueueService } from '../services/cart-queue.service';
import { Cart } from '../types/cart';

export function useAddToCart() {
  const { cart, setCart } = useCartStore();
  const { enqueue } = useCartQueueStore();

  return useMutation({
    // We use a dummy mutationFn because the actual work is done via the queue
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      enqueue({ type: 'add', variantId, quantity });
      return cartQueueService.flush();
    },

    onMutate: async ({ variantId, quantity }) => {
      if (!cart) return;

      const existingItemIndex = cart.items.findIndex(item => item.variant_id === variantId);
      
      let nextItems = [...cart.items];
      if (existingItemIndex > -1) {
        nextItems[existingItemIndex] = {
          ...nextItems[existingItemIndex],
          quantity: nextItems[existingItemIndex].quantity + quantity,
        };
      } else {
        nextItems.push({
          id: `opt_${Date.now()}`,
          variant_id: variantId,
          quantity,
          title: 'Добавление...',
          thumbnail: '',
          unit_price: 0,
          total: 0,
        } as any);
      }

      setCart({ ...cart, items: nextItems });
      return { previousCart: cart };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        setCart(context.previousCart);
      }
    },
  });
}
