import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '@/store/favorites-store';
import { ProductCard } from '@/components/product-card';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavoritesStore();

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (favorites.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="heart-outline" size={48} color="#DC2626" />
        </View>
        <Text className="text-dark text-xl font-black uppercase text-center mb-2">
            Нет избранных товаров
        </Text>
        <Text className="text-gray-500 text-center leading-5 mb-8">
            Добавляйте товары, чтобы вернуться к ним позже
        </Text>
        <Pressable 
            onPress={() => router.push('/(tabs)/catalog')}
            className="bg-primary px-8 py-3 rounded-sm active:opacity-90"
        >
            <Text className="text-white font-bold uppercase text-sm">Перейти в каталог</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-4 mb-2">
         <Text className="text-dark text-2xl font-black uppercase tracking-tight">ИЗБРАННОЕ</Text>
      </View>

      <FlatList
        data={favorites}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: '48%' }}>
              <ProductCard
                product={item}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(item)}
                onPress={() => handleProductPress(item.id)}
                onAddToCart={() => console.log('Add', item.id)}
              />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
