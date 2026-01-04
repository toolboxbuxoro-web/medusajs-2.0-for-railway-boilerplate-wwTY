import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { cartService } from '../services/cart.service';
import { useCartStore } from '../store/cart-store';
import { useCartQueueStore } from '../store/cart-queue.store';

class CartQueueService {
  private isFlushing = false;

  constructor() {
    // Flush when app comes to foreground
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.flush();
      }
    });
  }

  async flush() {
    if (this.isFlushing) return;

    // Check connectivity first
    const network = await NetInfo.fetch();
    if (!network.isConnected || network.isInternetReachable === false) {
       console.log('[CartQueue] Offline, skipping flush.');
       return;
    }
    
    const { cartId, setCart } = useCartStore.getState();
    if (!cartId) return;

    const queueStore = useCartQueueStore.getState();
    const next = queueStore.peek();

    if (!next) {
      console.log('[CartQueue] Queue empty.');
      return;
    }

    this.isFlushing = true;
    console.log('[CartQueue] Flushing mutation:', next.type);

    try {
      let updatedCart;
      switch (next.type) {
        case 'add':
          updatedCart = await cartService.addItem(cartId, next.variantId, next.quantity);
          break;
        case 'update':
          updatedCart = await cartService.updateItem(cartId, next.lineItemId, next.quantity);
          break;
        case 'remove':
          updatedCart = await cartService.removeItem(cartId, next.lineItemId);
          break;
      }

      if (updatedCart) {
        setCart(updatedCart);
      }

      // Mutation successful, remove from queue
      queueStore.dequeue();
      this.isFlushing = false;

      // Recursive call to process next item in queue
      this.flush();
    } catch (error) {
       console.error('[CartQueue] Flush failed:', error);
       this.isFlushing = false;
       // We keep it in the queue for next retry
    }
  }
}

export const cartQueueService = new CartQueueService();
