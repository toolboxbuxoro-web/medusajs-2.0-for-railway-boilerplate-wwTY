import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/cart-store';
import { useCartQueueStore } from '../store/cart-queue.store';
import { cartService } from '../services/cart.service';
import { useAddToCart } from './useAddToCart';
import { useUpdateCartItem } from './useUpdateCartItem';
import { useRemoveCartItem } from './useRemoveCartItem';
import { useNetworkStatus } from './useNetworkStatus';
import { cartQueueService } from '../services/cart-queue.service';

export function useCart() {
  const { cartId, cart, setCart, setCartId, loading: storeLoading, setLoading } = useCartStore();
  const { queue } = useCartQueueStore();
  const online = useNetworkStatus();
  
  const { mutateAsync: addItemMutation } = useAddToCart();
  const { mutateAsync: updateItemMutation } = useUpdateCartItem();
  const { mutateAsync: removeItemMutation } = useRemoveCartItem();

  const isQueueEmpty = queue.length === 0;

  // Unified Cart Fetching via React Query
  const { 
    data: serverCart, 
    isLoading: queryLoading, 
    error: queryError,
    refetch: refreshCart 
  } = useQuery({
    queryKey: ['cart', cartId],
    queryFn: () => cartId ? cartService.getCart(cartId) : Promise.reject('No cart ID'),
    enabled: !!cartId && online && isQueueEmpty, // Only fetch if online and queue is empty
    staleTime: 0, 
  });

  // Sync server data to Zustand store
  useEffect(() => {
    if (serverCart) {
      setCart(serverCart);
    }
  }, [serverCart, setCart]);

  // Flush queue when network becomes available
  useEffect(() => {
    if (online) {
      cartQueueService.flush();
    }
  }, [online]);

  // Handle cart expiration (404)
  useEffect(() => {
    if (queryError && (queryError as Error).message?.includes('404')) {
      setCartId(null);
      setCart(null);
    }
  }, [queryError, setCartId, setCart]);

  // Initial cart creation logic
  useEffect(() => {
    const init = async () => {
      if (!cartId && !queryLoading && online) {
        setLoading(true);
        try {
          const newCart = await cartService.createCart();
          setCartId(newCart.id);
          setCart(newCart);
        } catch (err) {
          console.error('Failed to create cart:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    init();
  }, [cartId, queryLoading, setCartId, setCart, setLoading, online]);

  return {
    cart,
    loading: queryLoading || storeLoading,
    error: queryError ? (queryError as Error).message : null,
    addItem: (variantId: string, quantity: number) => addItemMutation({ variantId, quantity }),
    updateItem: (lineItemId: string, quantity: number) => updateItemMutation({ lineItemId, quantity }),
    removeItem: (lineItemId: string) => removeItemMutation(lineItemId),
    refreshCart,
  };
}
