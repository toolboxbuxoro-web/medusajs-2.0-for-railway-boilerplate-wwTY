import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator, FlatList, Image, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductCard } from '@/components/product-card';
import { SectionRenderer } from '@/components/home/SectionRenderer';
import { BannerSliderSkeleton, CategoryChipsSkeleton, ProductRailSkeleton } from '@/components/home/skeletons';
import { LazySection } from '@/components/home/LazySection';
import { track } from '@/lib/analytics/track';

/**
 * Simple Header - Just search bar and notifications
 */
function Header() {
  const router = useRouter();

  return (
    <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
      {/* Search bar */}
      <Pressable 
        onPress={() => router.push('/search')}
        className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 active:opacity-80"
      >
        <Ionicons name="search" size={20} color="#6B7280" />
        <Text className="flex-1 ml-3 text-gray-500 font-medium">Поиск в Toolbox...</Text>
      </Pressable>
      
      {/* Notifications */}
      <Pressable className="p-2 ml-2">
        <Ionicons name="notifications-outline" size={26} color="#1F2937" />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: feed, isLoading, refetch } = useHomeFeed();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const hasFeedData = feed?.sections && feed.sections.length > 0;


  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Header />
      
      {hasFeedData ? (
        <FlatList
          data={feed?.sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <SectionRenderer section={item} index={index} />}
          contentContainerStyle={{ paddingBottom: 100, backgroundColor: '#F3F4F6' }}
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

/**
 * Legacy Home UI Components
 */

const categories = [
  { id: '1', name: 'Дрели', icon: 'construct-outline' as const },
  { id: '2', name: 'Болгарки', icon: 'disc-outline' as const },
  { id: '3', name: 'Сад', icon: 'leaf-outline' as const },
  { id: '4', name: 'Наборы', icon: 'grid-outline' as const },
];

function HeroBanner() {
  const router = useRouter();

  const handleImpression = () => {
    track('section_impression', {
      section_id: 'hero_banner',
      section_type: 'banner_slider',
      position: 0,
    });
  };

  const handlePress = () => {
    track('section_click', {
      section_id: 'hero_banner',
      section_type: 'banner_slider',
    });
    router.push('/(tabs)/catalog');
  };

  return (
    <LazySection height={150} skeleton={<BannerSliderSkeleton />} onImpression={handleImpression}>
      <View className="px-4 mt-4">
        <Pressable onPress={handlePress}>
          <LinearGradient
            colors={['#111827', '#374151']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-xl p-0 overflow-hidden border-l-4 border-primary relative"
          >
            <View className="absolute right-0 top-0 bottom-0 w-32 bg-primary/10 -skew-x-12 transform translate-x-8" />
            <View className="flex-row items-center justify-between p-5">
              <View className="flex-1 pr-4 z-10">
                <Text className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Спецпредложение</Text>
                <Text className="text-white text-2xl font-black leading-7 mb-4 uppercase">MAKITA PRO SERIES</Text>
                <View className="bg-primary rounded-lg py-2 px-6 self-start active:opacity-90">
                  <Text className="text-white font-bold text-sm uppercase tracking-wider">Купить сейчас</Text>
                </View>
              </View>
              <View className="w-24 h-24 bg-white/5 rounded-full items-center justify-center border-2 border-primary/30">
                <Ionicons name="construct" size={48} color="#DC2626" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </LazySection>
  );
}

function CategoriesSection() {
  const { data: categories, isLoading } = useCategories('parent_id=null');

  const handleImpression = () => {
    track('section_impression', {
      section_id: 'legacy_categories',
      section_type: 'category_chips',
      position: 1,
    });
  };

  const handlePress = (categoryName: string) => {
    track('section_click', {
      section_id: 'legacy_categories',
      section_type: 'category_chips',
    });
  };

  if (isLoading || !categories?.length) {
    return <CategoryChipsSkeleton />;
  }

  return (
    <LazySection height={140} skeleton={<CategoryChipsSkeleton />} onImpression={handleImpression}>
      <View className="mt-8">
        <View className="flex-row items-center justify-between px-4 mb-4">
          <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">
            Категории
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {categories.map((category) => (
            <Pressable 
              key={category.id} 
              onPress={() => handlePress(category.name)}
              className="items-center mr-4 active:opacity-70 w-20"
            >
              <View className="w-16 h-16 bg-white border border-gray-200 rounded-sm items-center justify-center mb-2 shadow-sm">
                <Ionicons name="cube-outline" size={28} color="#1F2937" />
              </View>
              <Text 
                  numberOfLines={1}
                  className="text-gray-800 text-[10px] font-bold text-center uppercase tracking-tight"
              >
                  {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </LazySection>
  );
}

function FeaturedProductsContent() {
  const router = useRouter();
  const { data: products, isLoading, error } = useProducts('limit=6');

  const handleProductPress = (productId: string, productIndex: number) => {
    track('product_click', {
      product_id: productId,
      section_id: 'legacy_featured',
      section_type: 'product_rail',
      position_in_rail: productIndex,
    });
    router.push(`/product/${productId}`);
  };

  const handleAllPress = () => {
    track('section_click', {
      section_id: 'legacy_featured',
      section_type: 'product_rail',
    });
    router.push('/(tabs)/catalog');
  };

  if (isLoading || error || !products?.length) {
    return <ProductRailSkeleton />;
  }

  return (
    <View className="mt-6 px-2">
      <View className="flex-row items-center justify-between px-2 mb-4">
        <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">Хиты продаж</Text>
        <Pressable onPress={handleAllPress}>
            <Text className="text-primary font-bold text-xs uppercase">Все</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap">
        {products?.map((item, index) => (
          <View key={item.id} style={{ width: '50%', padding: 4 }}>
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id, index)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturedProducts() {
  const handleImpression = () => {
    track('section_impression', {
      section_id: 'legacy_featured',
      section_type: 'product_rail',
      position: 2,
    });
  };

  return (
    <LazySection height={500} skeleton={<ProductRailSkeleton />} onImpression={handleImpression}>
      <FeaturedProductsContent />
    </LazySection>
  );
}
