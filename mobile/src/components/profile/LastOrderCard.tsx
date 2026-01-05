import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/cart';

interface LastOrderCardProps {
  order?: Order;
}

/**
 * LastOrderCard component that displays summary of the most recent order.
 * Follows strict rules: only renders if data is provided and uses existing fields.
 */
export function LastOrderCard({ order }: LastOrderCardProps) {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch {
      return '';
    }
  };

  const statusLabel = order.status === 'completed' ? 'Завершен' : 'В обработке';

  return (
    <View className="px-4 mt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-900 text-lg font-bold">Последний заказ</Text>
        <Pressable onPress={() => console.log('Navigate to all orders')}>
          <Text className="text-primary font-bold text-sm">Все</Text>
        </Pressable>
      </View>

      <Pressable 
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex-row items-center"
        onPress={() => console.log(`Navigate to order ${order.id}`)}
      >
        <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-3">
          <Ionicons name="cube-outline" size={24} color="#374151" />
        </View>

        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base">
            Заказ №{order.display_id}
          </Text>
          <Text className="text-gray-500 text-xs">
            {formatDate(order.created_at)} • {statusLabel}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-gray-900 font-bold">
            {order.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#E5E7EB" marginTop={4} />
        </View>
      </Pressable>
    </View>
  );
}
