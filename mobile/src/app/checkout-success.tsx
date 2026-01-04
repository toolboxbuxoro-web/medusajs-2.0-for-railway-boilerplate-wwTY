import { View, Text, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { orderId, total } = useLocalSearchParams();

  const handleHome = () => {
    router.dismissAll();
    router.replace('/(tabs)/');
  };

  const formatPrice = (price: string | string[]) => {
    return Number(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' UZS';
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Stack.Screen 
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent going back to checkout
        }} 
      />
      
      <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-6">
        <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
      </View>
      
      <Text className="text-gray-900 text-3xl font-bold mb-2 text-center">
        Заказ оформлен!
      </Text>
      
      <Text className="text-gray-500 text-base text-center mb-8 px-4">
        Спасибо за покупку. Мы свяжемся с вами в ближайшее время для подтверждения.
      </Text>

      <View className="bg-gray-50 p-6 rounded-2xl w-full mb-8 border border-gray-100">
         <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-200">
             <Text className="text-gray-500">Номер заказа</Text>
             <Text className="text-gray-900 font-bold">#{orderId}</Text>
         </View>
         <View className="flex-row justify-between">
             <Text className="text-gray-500">Итого к оплате</Text>
             <Text className="text-blue-600 font-bold text-lg">
                {formatPrice(total)}
             </Text>
         </View>
      </View>

      <Pressable
        onPress={handleHome}
        className="w-full bg-primary py-4 rounded-xl items-center active:bg-primary-dark"
      >
        <Text className="text-white text-base font-bold uppercase tracking-widest">
          На главную
        </Text>
      </Pressable>
    </View>
  );
}
