import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product-card';
import { SectionRenderer } from '@/components/home/SectionRenderer';

/**
 * ⚠️ LEGACY HOME UI COMPONENTS
 * TODO: Remove legacy Home UI after full rollout
 */

const categories = [
  { id: '1', name: 'Дрели', icon: 'construct-outline' as const },
  { id: '2', name: 'Болгарки', icon: 'disc-outline' as const },
  { id: '3', name: 'Сад', icon: 'leaf-outline' as const },
  { id: '4', name: 'Наборы', icon: 'grid-outline' as const },
];

function HeroBanner() {
  return (
    <View className="px-4 mt-6">
      <LinearGradient
        colors={['#111827', '#374151']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-sm p-0 overflow-hidden border-l-4 border-primary relative"
      >
        <View className="absolute right-0 top-0 bottom-0 w-32 bg-primary/10 -skew-x-12 transform translate-x-8" />
        <View className="flex-row items-center justify-between p-5">
          <View className="flex-1 pr-4 z-10">
            <Text className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Спецпредложение</Text>
            <Text className="text-white text-2xl font-black leading-7 mb-4 uppercase">MAKITA PRO SERIES</Text>
            <Pressable className="bg-primary rounded-sm py-2 px-6 self-start active:opacity-90">
              <Text className="text-white font-bold text-sm uppercase tracking-wider">Купить сейчас</Text>
            </Pressable>
          </View>
          <View className="w-24 h-24 bg-white/5 rounded-full items-center justify-center border-2 border-primary/30">
            <Ionicons name="construct" size={48} color="#DC2626" />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function CategoriesSection() {
  return (
    <View className="mt-8">
      <View className="px-4 mb-4">
        <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">Категории</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {categories.map((category) => (
          <Pressable key={category.id} className="items-center mr-4 active:opacity-70 w-20">
            <View className="w-16 h-16 bg-white border border-gray-200 rounded-sm items-center justify-center mb-2 shadow-sm">
              <Ionicons name={category.icon} size={28} color="#1F2937" />
            </View>
            <Text className="text-gray-800 text-xs font-bold text-center uppercase tracking-tight">{category.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FeaturedProducts() {
  const router = useRouter();
  const { data: products, isLoading } = useProducts('limit=6');

  if (isLoading) return <ActivityIndicator className="mt-8" color="#333" />;

  return (
    <View className="mt-8 px-2">
      <View className="flex-row items-center justify-between px-2 mb-4">
        <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">Хиты продаж</Text>
        <Pressable onPress={() => router.push('/(tabs)/catalog')}>
            <Text className="text-primary font-bold text-xs uppercase">Все</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {products?.map((item) => (
          <View key={item.id} style={{ width: '50%', padding: 4 }}>
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function Header() {
  const router = useRouter();
  return (
    <View className="bg-dark px-4 pb-4 pt-2">
        <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-2xl font-black tracking-tighter uppercase italic">
                TOOL<Text className="text-primary">BOX</Text>
            </Text>
            <View className="flex-row items-center">
              <Pressable className="p-2 mr-2" onPress={() => router.push('/search')}>
                  <Ionicons name="search" size={24} color="white" />
              </Pressable>
              <Pressable className="p-2">
                  <Ionicons name="notifications-outline" size={24} color="white" />
              </Pressable>
            </View>
        </View>
        <Pressable 
            onPress={() => router.push('/search')}
            className="flex-row items-center bg-dark-light rounded-sm px-3 py-2 border border-gray-700 active:opacity-80"
        >
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <Text className="flex-1 ml-2 text-gray-400 font-medium tracking-tight">Поиск инструментов...</Text>
        </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { data: feed, isLoading, refetch } = useHomeFeed();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const hasFeedData = feed?.sections && feed.sections.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <Header />
      
      {hasFeedData ? (
        <FlatList
          data={feed?.sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SectionRenderer section={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
          }
        >
          {isLoading && !refreshing && (
             <ActivityIndicator className="mt-10" color="#DC2626" />
          )}
          <HeroBanner />
          <CategoriesSection />
          <FeaturedProducts />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
