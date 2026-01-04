import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCollections } from '@/hooks/useCollections';
import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogScreen() {
  const router = useRouter();
  const { data: collections, isLoading, error, refetch } = useCollections();

  const handleCategoryPress = (collectionId: string) => {
    router.push(`/catalog/${collectionId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 py-4 border-b border-gray-100 flex-row items-center bg-white justify-between">
           <Text className="text-dark text-2xl font-black uppercase tracking-tight">Каталог</Text>
           <Ionicons name="search" size={24} color="#1F2937" />
        </View>
        <View className="p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <View key={i} className="flex-row items-center py-4 border-b border-gray-100">
               <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 16 }} />
               <Skeleton width="60%" height={20} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6" edges={['top']}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-xl font-bold mt-4 text-center">Ошибка загрузки</Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">{error instanceof Error ? error.message : String(error)}</Text>
        <Pressable 
          onPress={() => refetch()}
          className="bg-primary px-8 py-3 rounded-md"
        >
          <Text className="text-white font-bold">Попробовать снова</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-4 border-b border-gray-100 flex-row items-center bg-white justify-between">
         <Text className="text-dark text-2xl font-black uppercase tracking-tight">Каталог</Text>
         <Pressable onPress={() => router.push('/search')}>
            <Ionicons name="search" size={24} color="#1F2937" />
         </Pressable>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={() => (
           <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-gray-500">Коллекции не найдены</Text>
           </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleCategoryPress(item.id)}
            className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 active:bg-gray-50"
            accessibilityRole="button"
            accessibilityLabel={`Открыть категорию ${item.title}`}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-4">
                 <Ionicons name="flash-outline" size={22} color="#DC2626" />
              </View>
              <Text className="text-gray-900 text-base font-bold">{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
