import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from '../../components/product-card';
import { useProducts } from '@/hooks/useProducts';
import { useCollection } from '@/hooks/useCollections';

export default function CollectionProductsScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const router = useRouter();
  
  // 1. Fetch Collection details (for the header title)
  const { data: collection, isLoading: isLoadingCollection } = useCollection(collectionId!);
  
  // 2. Fetch Products filtered by collection
  const { data: products, isLoading: isLoadingProducts, error, refetch } = useProducts(`collection_id=${collectionId}`);
  
  const categoryTitle = collection?.title || 'Загрузка...';

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: categoryTitle.toUpperCase(),
          headerStyle: { backgroundColor: '#111827' }, 
          headerTintColor: '#FFFFFF', 
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          ),
          headerRight: () => (
             <Pressable>
               <Ionicons name="options-outline" size={24} color="#FFFFFF" />
             </Pressable>
          ),
          headerShadowVisible: false,
        }} 
      />
      
      {/* Search / Filter Bar */}
      <View className="bg-dark px-4 pb-4">
         <Text className="text-gray-400 text-xs uppercase tracking-widest font-bold">
            Найдено {products ? products.length : 0} товаров
         </Text>
      </View>

      {(isLoadingCollection || isLoadingProducts) ? (
        <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#333" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
            <Text className="text-red-500 text-center mb-4">Не удалось загрузить товары</Text>
            <Pressable onPress={() => router.replace('/(tabs)/catalog')} className="bg-primary px-4 py-2 rounded-sm">
                <Text className="text-white font-bold">Вернуться</Text>
            </Pressable>
        </View>
      ) : (
        <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center pt-24 opactiy-50">
                <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4 border-2 border-gray-300 border-dashed">
                <Ionicons name="construct-outline" size={48} color="#9ca3af" />
                </View>
                <Text className="text-dark text-xl font-black uppercase tracking-wide">Список пуст</Text>
                <Text className="text-gray-500 text-sm mt-2 text-center px-10">
                    В этой коллекции пока нет товаров.
                </Text>
            </View>
            )}
            renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
                <ProductCard
                    product={item}
                    onPress={() => handleProductPress(item.id)}
                />
            </View>
            )}
        />
      )}
    </View>
  );
}
