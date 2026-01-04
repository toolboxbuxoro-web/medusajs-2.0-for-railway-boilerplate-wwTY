import { useState } from 'react';
import { cartService } from '../services/cart.service';
import { useCartStore } from '../store/cart-store';
import { Order } from '../types/cart';

export interface CheckoutFormData {
  name: string;
  phone: string;
  city: string;
  comment?: string;
}

export function useCheckout() {
  const { cartId, resetCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  // Uzbekistan phone validation: +998 XX XXX XX XX
  const validatePhone = (phone: string): boolean => {
    // Remove all spaces and non-digits except +
    const cleaned = phone.replace(/[\s-]/g, '');
    // Match +998XXXXXXXXX (9 digits after +998) or 998XXXXXXXXX
    const uzbekPhoneRegex = /^(\+998|998)[0-9]{9}$/;
    return uzbekPhoneRegex.test(cleaned);
  };

  const submitOrder = async (formData: CheckoutFormData) => {
    if (!cartId) {
      setError('Нет активной корзины');
      return null;
    }

    // Validate phone
    if (!validatePhone(formData.phone)) {
      setError('Неверный формат телефона. Используйте: +998 XX XXX XX XX');
      return null;
    }

    // Prevent double-submit
    if (loading) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Update cart with shipping address BEFORE completing
      await cartService.updateCart(cartId, {
        shipping_address: {
          first_name: formData.name,
          phone: formData.phone,
          address_1: formData.comment || 'Не указано',
          city: formData.city || 'Бухара',
          country_code: 'uz',
        },
      });

      // Step 2: Complete the cart
      const completedOrder = await cartService.complete(cartId);
      setOrder(completedOrder);
      
      // Step 3: Clear local cart state
      resetCart();
      
      return completedOrder;
    } catch (err: any) {
      console.error('Checkout failed:', err);
      
      // User-friendly error messages
      let userMessage = 'Ошибка оформления заказа';
      if (err.message?.includes('404')) {
        userMessage = 'Корзина не найдена. Пожалуйста, начните заново.';
      } else if (err.message?.includes('payment')) {
        userMessage = 'Ошибка оплаты. Проверьте данные и попробуйте снова.';
      } else if (err.message?.includes('inventory')) {
        userMessage = 'Некоторые товары закончились. Обновите корзину.';
      }
      
      setError(userMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitOrder,
    loading,
    error,
    order,
    validatePhone,
  };
}
