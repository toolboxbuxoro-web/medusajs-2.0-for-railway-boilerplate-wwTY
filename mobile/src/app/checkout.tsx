import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart } = useCart();
  const { submitOrder, loading: submitting, error: submitError, validatePhone } = useCheckout();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' UZS';
  };

  // Real-time phone validation
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value.trim() && !validatePhone(value)) {
      setPhoneError('Формат: +998 XX XXX XX XX');
    } else {
      setPhoneError('');
    }
  };

  const isFormValid = name.trim() !== '' && phone.trim() !== '' && !phoneError;
  const canSubmit = isFormValid && cart && cart.items.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const order = await submitOrder({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim() || 'Бухара',
      comment: comment.trim(),
    });

    if (order) {
      router.replace({
        pathname: '/checkout-success',
        params: { orderId: order.display_id, total: order.total }
      });
    } else if (submitError) {
      Alert.alert("Ошибка", submitError);
    }
  };

  if (!cart) return null; // Should ideally show loading or redirect

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          headerTitle: "Оформление заказа",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="ml-0 p-2">
              <Ionicons name="chevron-back" size={28} color="#111827" />
            </Pressable>
          ),
          headerShadowVisible: false,
        }} 
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Контактные данные
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Имя <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Введите ваше имя"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-200"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Телефон <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                className={`bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border ${
                  phoneError ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {phoneError && (
                <Text className="text-red-500 text-xs mt-1">{phoneError}</Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Город
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Бухара"
                placeholderTextColor="#9ca3af"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-200"
              />
            </View>

            <View>
              <Text className="text-gray-700 text-sm font-medium mb-2">
                Комментарий
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Дополнительная информация"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border border-gray-200"
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Итого
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-base">Товаров</Text>
              <Text className="text-gray-900 text-base font-semibold">
                {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
              </Text>
            </View>

            <View className="flex-row justify-between pt-3 border-t border-gray-200">
              <Text className="text-gray-900 text-lg font-bold">К оплате</Text>
              <Text className="text-blue-600 text-xl font-bold">
                {formatPrice(cart.total)}
              </Text>
            </View>
          </View>
        </View>

        {submitError && (
            <View className="px-4 mb-4">
                <Text className="text-red-500 text-center font-medium bg-red-50 p-3 rounded-lg">
                    {submitError}
                </Text>
            </View>
        )}

        <View className="h-32" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-xl py-4 items-center justify-center ${
            canSubmit
              ? 'bg-blue-600 active:bg-blue-700'
              : 'bg-gray-300'
          }`}
        >
          {submitting ? (
             <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">
                Подтвердить заказ
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
