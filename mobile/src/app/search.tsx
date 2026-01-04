import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentSearches } from '@/hooks/useRecentSearches';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  
  const { searches, addSearch, clearSearches, removeSearch } = useRecentSearches();

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length > 2) {
        addSearch(query.trim());
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, addSearch]);

  // Fetch products based on debounced query
  const { data: products = [], isLoading, error } = useProducts(debouncedQuery ? `q=${debouncedQuery}` : '');

  const handleProductPress = (id: string) => {
    router.push(`/product/${id}`);
  };

  const handleHistoryPress = (term: string) => {
    setQuery(term);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header / Search Input */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            ref={inputRef}
            className="flex-1 ml-2 text-dark font-medium h-8"
            placeholder="Поиск инструментов..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        {/* Recent Searches Header */}
        {query.length === 0 && searches.length > 0 && (
          <View className="p-4">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-dark font-black uppercase text-xs tracking-widest">История поиска</Text>
                <Pressable onPress={clearSearches}>
                   <Text className="text-primary text-xs font-bold uppercase">Очистить</Text>
                </Pressable>
             </View>
             <View className="flex-row flex-wrap gap-2">
                {searches.map((item, index) => (
                   <Pressable 
                      key={index} 
                      onPress={() => handleHistoryPress(item)}
                      className="bg-white border border-gray-200 px-3 py-1.5 rounded-full flex-row items-center"
                   >
                      <Text className="text-gray-700 text-sm mr-2">{item}</Text>
                      <Pressable onPress={() => removeSearch(item)}>
                         <Ionicons name="close" size={14} color="#9CA3AF" />
                      </Pressable>
                   </Pressable>
                ))}
             </View>
          </View>
        )}

        {isLoading && query.length > 0 ? (
          <View className="p-4 flex-row flex-wrap justify-between">
            {[...Array(4)].map((_, i) => (
              <View key={i} style={{ width: '48%', marginBottom: 16 }}>
                 <Skeleton height={160} width="100%" />
                 <View className="mt-2 space-y-2">
                    <Skeleton height={12} width="80%" />
                    <Skeleton height={12} width="40%" />
                 </View>
              </View>
            ))}
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-gray-500 mt-2 text-center">{error instanceof Error ? error.message : String(error)}</Text>
          </View>
        ) : products.length === 0 && query.length > 0 && !isLoading ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text className="text-dark font-black uppercase text-lg mt-4">Ничего не найдено</Text>
            <Text className="text-gray-500 text-center mt-2">
              Попробуйте изменить запрос или поискать в другом разделе
            </Text>
          </View>
        ) : products.length === 0 && query.length === 0 ? (
           <View className="flex-1 items-center justify-center p-6 opacity-40">
              <Ionicons name="flashlight-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 font-bold uppercase tracking-widest">Начните поиск</Text>
           </View>
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
              <View style={{ width: '48%' }}>
                <ProductCard
                  product={item}
                  searchQuery={debouncedQuery}
                  onPress={() => handleProductPress(item.id)}
                />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
