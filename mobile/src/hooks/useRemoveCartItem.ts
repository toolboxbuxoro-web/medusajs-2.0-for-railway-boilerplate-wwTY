import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '../store/cart-store';
import { useCartQueueStore } from '../store/cart-queue.store';
import { cartQueueService } from '../services/cart-queue.service';
import { Cart } from '../types/cart';

export function useRemoveCartItem() {
  const { cart, setCart } = useCartStore();
  const { enqueue } = useCartQueueStore();

  return useMutation({
    mutationFn: async (lineItemId: string) => {
      enqueue({ type: 'remove', lineItemId });
      return cartQueueService.flush();
    },

    onMutate: async (lineItemId) => {
      if (!cart) return;

      const optimisticCart: Cart = {
        ...cart,
        items: cart.items.filter((i) => i.id !== lineItemId),
      };

      setCart(optimisticCart);
      return { previousCart: cart };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousCart) setCart(ctx.previousCart);
    },
  });
}
