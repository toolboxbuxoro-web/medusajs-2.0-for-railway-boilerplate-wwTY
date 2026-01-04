import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCart } from '../../hooks/useCart';
import { LineItem } from '../../types/cart';

export default function CartScreen() {
  const router = useRouter();
  const { cart, loading, error, updateItem, removeItem, refreshCart } = useCart();

  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' UZS';
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleIncrease = (item: LineItem) => {
    updateItem(item.id, item.quantity + 1);
  };

  const handleDecrease = (item: LineItem) => {
    if (item.quantity > 1) {
      updateItem(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  if (loading && !cart) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-4">Загрузка корзины...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 text-xl font-bold mb-2 text-center mt-4">Ошибка загрузки</Text>
        <Text className="text-gray-500 text-sm text-center mb-6">{error}</Text>
        <Pressable
          onPress={() => refreshCart()}
          className="bg-blue-600 px-6 py-3 rounded-xl active:bg-blue-700"
        >
          <Text className="text-white font-bold">Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;
  const totalQuantity = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          headerTitle: "Корзина",
          headerShadowVisible: false,
        }} 
      />

      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart-outline" size={48} color="#9ca3af" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2">Корзина пуста</Text>
          <Text className="text-gray-500 text-sm text-center">
            Добавьте товары в корзину, чтобы оформить заказ
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(item) => item.id}
            contentContainerClassName="p-4"
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 mb-3 flex-row shadow-sm">
                <View className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-3">
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                  />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-gray-900 text-base font-semibold leading-5 mb-1"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-blue-600 text-lg font-bold mb-2">
                    {formatPrice(item.unit_price)}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center bg-gray-100 rounded-lg">
                      <Pressable
                        onPress={() => handleDecrease(item)}
                        className="w-8 h-8 items-center justify-center active:bg-gray-200"
                      >
                        <Ionicons name="remove" size={20} color="#374151" />
                      </Pressable>
                      <Text className="text-gray-900 text-base font-bold px-3">
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => handleIncrease(item)}
                        className="w-8 h-8 items-center justify-center active:bg-gray-200"
                      >
                        <Ionicons name="add" size={20} color="#374151" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => removeItem(item.id)}
                      className="w-8 h-8 items-center justify-center active:opacity-50"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />

          <View className="bg-white border-t border-gray-200 p-4">
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600 text-base">Товаров</Text>
                <Text className="text-gray-900 text-base font-semibold">
                  {totalQuantity}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-900 text-lg font-bold">Итого</Text>
                <Text className="text-blue-600 text-xl font-bold">
                  {formatPrice(cart.total)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCheckout}
              disabled={isEmpty || loading}
              className={`rounded-xl py-4 items-center justify-center ${
                (isEmpty || loading) ? 'bg-gray-300' : 'bg-blue-600 active:bg-blue-700'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Оформить заказ
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

