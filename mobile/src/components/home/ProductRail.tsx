import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '../product-card';
import { useProducts } from '../../hooks/useProducts';

interface ProductRailProps {
  collectionId: string;
  title: string;
}

export function ProductRail({ collectionId, title }: ProductRailProps) {
  const router = useRouter();
  const { data: products, isLoading, error } = useProducts(`collection_id[]=${collectionId}&limit=8`);

  if (isLoading) {
    return (
      <View className="mt-8 h-40 justify-center items-center">
        <ActivityIndicator color="#333" />
      </View>
    );
  }

  if (error || !products?.length) return null;

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">
          {title}
        </Text>
        <Pressable onPress={() => router.push(`/catalog/${collectionId}`)}>
            <Text className="text-primary font-bold text-xs uppercase tracking-wider">Все</Text>
        </Pressable>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {products.map((product) => (
          <View key={product.id} style={{ width: 160, marginRight: 12 }}>
            <ProductCard
              product={product}
              onPress={() => router.push(`/product/${product.id}`)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
