import { View, Text, ScrollView, Pressable, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCart } from '@/hooks/useCart';
import { useProduct } from '@/hooks/useProduct';
import { Alert } from 'react-native';
import { ProductCard } from '@/components/product-card'; // Import ProductCard
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- COMPONENTS ---

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center mb-2">
      <View className="w-5 h-5 rounded-full bg-green-100 items-center justify-center mr-2">
        <Ionicons name="checkmark" size={12} color="#166534" />
      </View>
      <Text className="text-gray-700 font-medium text-sm">{text}</Text>
    </View>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-100">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-dark font-medium text-sm">{value}</Text>
    </View>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View className="border-t border-gray-200">
      <Pressable 
        onPress={() => setExpanded(!expanded)}
        className="flex-row justify-between items-center py-4 px-4 bg-white active:bg-gray-50"
        accessibilityRole="button"
        accessibilityLabel={`Развернуть ${title}`}
      >
        <Text className="text-dark font-bold uppercase text-sm">{title}</Text>
        <Ionicons name={expanded ? 'remove' : 'add'} size={20} color="#374151" />
      </Pressable>
      {expanded && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}

// Mock Related Products - updated to match Product interface
const RELATED_PRODUCTS: any[] = [
  { 
    id: 'rel_1', 
    title: 'Набор инструментов FORCE', 
    thumbnail: 'https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=800&q=80',
    images: [],
    variants: [{ id: 'v1', prices: [{ amount: 1250000, currency_code: 'uzs' }] }],
    options: []
  },
  { 
    id: 'rel_2', 
    title: 'Перфоратор BOSCH', 
    thumbnail: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    images: [],
    variants: [{ id: 'v2', prices: [{ amount: 950000, currency_code: 'uzs' }] }],
    options: []
  },
  { 
    id: 'rel_3', 
    title: 'Лазерный уровень', 
    thumbnail: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
    images: [],
    variants: [{ id: 'v3', prices: [{ amount: 450000, currency_code: 'uzs' }] }],
    options: []
  },
];

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Use the hook for data
  const { data: product, isLoading, error, refetch } = useProduct(id);
  
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const { addItem } = useCart();

  const router = useRouter();

  // Variant & Quantity State
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // CRITICAL: Always auto-select first variant to prevent undefined variant bugs
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariantId]);
  
  // Store
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = product ? isFavorite(product.id) : false;

  // Formatting
  const formatPrice = (price?: number) => {
    if (price === undefined) return '...';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product);
  };

  // SKELETON LOADING STATE
  if (isLoading) {
      return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerTransparent: true, title: '' }} />
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Image Skeleton */}
                <Skeleton height={SCREEN_WIDTH} width={SCREEN_WIDTH} borderRadius={0} />
                <View className="p-4 space-y-4">
                    {/* Title Skeleton */}
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={20} width="40%" />
                    
                    {/* Price Block Skeleton */}
                     <View className="flex-row justify-between mt-4">
                        <Skeleton height={30} width="40%" />
                        <Skeleton height={30} width="30%" />
                    </View>

                     {/* Description Lines */}
                     <View className="mt-8 space-y-2">
                        <Skeleton height={14} width="100%" />
                        <Skeleton height={14} width="90%" />
                        <Skeleton height={14} width="95%" />
                     </View>
                </View>
            </SafeAreaView>
             {/* Bottom Bar Skeleton */}
             <View className="p-4 border-t border-gray-100 flex-row gap-4">
                 <Skeleton height={50} width={50} />
                 <Skeleton height={50} style={{ flex: 1 }} />
             </View>
        </View>
      );
  }

  // If error
  if (error || !product) {
      return (
          <View className="flex-1 bg-white items-center justify-center px-6">
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text className="text-xl font-bold mt-4 text-center">Ошибка загрузки</Text>
              <Text className="text-gray-500 text-center mt-2 mb-6">{error instanceof Error ? error.message : (error || 'Товар не найден')}</Text>
              <Pressable onPress={() => refetch()} className="bg-primary px-6 py-3 rounded-md">
                   <Text className="text-white font-bold">Повторить</Text>
              </Pressable>
          </View>
      );
  }

  // Derived data
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  
  // CRITICAL: Select price by currency (UZS), not just prices[0]
  const getPrice = (variant: typeof product.variants[0]) => {
    const uzsPrice = variant?.prices?.find(p => p.currency_code?.toLowerCase() === 'uzs');
    return uzsPrice?.amount || variant?.prices?.[0]?.amount || 0;
  };
  
  const price = selectedVariant ? getPrice(selectedVariant) : getPrice(product.variants[0]);
  const oldPrice = undefined; 

  const images = product.images?.map(img => img.url) || [];
  if (product.thumbnail && !images.includes(product.thumbnail)) {
      images.unshift(product.thumbnail);
  }
  
  const features = product.metadata?.features as string[] || [];
  const specs = product.metadata?.specs as {key:string, value:string}[] || [];
  const tags = product.metadata?.tags as string[] || [];

  const visibleSpecs = showAllSpecs ? specs : specs.slice(0, 4);
  const showVariants = product.variants && product.variants.length > 1;

  // CRITICAL: Stock logic must handle undefined variant safely
  const canBackorder = selectedVariant?.allow_backorder ?? false;
  const manageInventory = selectedVariant?.manage_inventory ?? false;
  const inventoryQuantity = selectedVariant?.inventory_quantity ?? 0;
  
  // Max quantity logic
  let maxQuantity = 100; // default large number
  if (manageInventory && !canBackorder) {
    maxQuantity = Math.max(0, inventoryQuantity);
  }
  
  // CRITICAL: Treat undefined variant as out of stock
  const inStock = selectedVariant && (!manageInventory || inventoryQuantity > 0 || canBackorder); 
  const isOutOfStock = !inStock || !selectedVariant;
  
  // Handlers
  const handleIncrease = () => {
    if (quantity < maxQuantity) setQuantity(prev => prev + 1);
  };
  
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          title: '',
          headerTransparent: true, 
          headerTintColor: '#111827',
          headerRight: () => (
            <Pressable className="bg-white/90 p-2 rounded-full shadow-sm" accessibilityLabel="Поделиться">
                <Ionicons name="share-outline" size={24} color="#111827" />
            </Pressable>
          ),
          headerLeft: (props) => props.canGoBack ? (
            <Pressable onPress={() => router.back()} className="bg-white/90 p-2 rounded-full shadow-sm ml-2" accessibilityLabel="Назад">
                <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
          ) : null
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* 1. GALLERY */}
        <View className="bg-white relative mb-4">
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(ev) => {
              const index = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(index);
            }}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}>
                <Image
                  source={{ uri: item }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                />
              </View>
            )}
          />
          {/* Pagination Dots */}
          <View className="flex-row justify-center absolute bottom-4 w-full">
            {images.map((_, idx) => (
              <View
                key={idx}
                className={`w-2 h-2 rounded-full mx-1 ${
                  activeImage === idx ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
        </View>

        {/* 2. MAIN META */}
        <View className="bg-white px-4 py-6 mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-primary font-black uppercase text-xs tracking-widest mb-2">
              {product.handle}
            </Text>
            {/* SKU */}
            {selectedVariant && (
                <View className="bg-gray-100 px-2 py-1 rounded-sm">
                    <Text className="text-gray-500 text-[10px] font-bold">SKU: {selectedVariant.id.slice(0, 8)}</Text>
                </View>
            )}
          </View>
          
          <Text className="text-dark text-2xl font-black uppercase leading-8 mb-3">
            {product.title}
          </Text>

          <View className="flex-row items-center mb-6">
            <View className="flex-row items-center bg-yellow-100 px-2 py-1 rounded-sm mr-3">
                <Ionicons name="star" size={14} color="#D97706" />
                <Text className="text-yellow-800 font-bold ml-1 text-xs">{(product.metadata?.rating as string) || '5.0'}</Text>
            </View>
            <Text className="text-gray-500 text-sm font-medium underline">
              {(product.metadata?.reviewsCount as string) || '0'} отзывов
            </Text>
          </View>

          {/* VARIANT SELECTOR */}
          {showVariants && (
            <View className="mb-6">
               <Text className="text-dark font-bold text-sm mb-3">Варианты:</Text> 
               <View className="flex-row flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    return (
                        <Pressable 
                            key={v.id}
                            onPress={() => setSelectedVariantId(v.id)}
                            className={`px-4 py-2 rounded-lg border ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`Вариант ${v.title}`}
                        >
                            <Text className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                {v.title}
                            </Text>
                        </Pressable>
                    )
                  })}
               </View>
            </View>
          )}

          {/* 3. SHORT FEATURES */}
          {features.length > 0 && (
            <View className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                {features.map((feat: string, idx: number) => (
                <FeatureItem key={idx} text={feat} />
                ))}
            </View>
          )}

          {/* DELIVERY INFO */}
          <View className="mt-4 pt-4 border-t border-gray-100">
             <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                   <Ionicons name="car-outline" size={18} color="#2563EB" />
                </View>
                <View className="flex-1">
                    <Text className="text-dark font-bold text-sm mb-0.5">
                        Доставка: {(product.metadata?.delivery as any)?.city || 'Бухара'}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                         {(product.metadata?.delivery as any)?.time || '1–2 дня'} · <Text className="text-green-600 font-medium">{(product.metadata?.delivery as any)?.cost || 'Бесплатно'}</Text>
                    </Text>
                </View>
             </View>
          </View>
        </View>

         {/* 4. DESCRIPTION & CHIPS */}
        <View className="bg-white px-4 py-6 mb-4">
            <Text className="text-dark text-lg font-black uppercase mb-4 border-l-4 border-primary pl-3">
                Описание
            </Text>
            
            {tags.length > 0 && (
                <View className="flex-row flex-wrap mb-4">
                    {tags.map((tag: string, idx: number) => (
                        <View key={idx} className="bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full mr-2 mb-2">
                            <Text className="text-gray-700 text-xs font-semibold">{tag}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Text className="text-gray-600 leading-6 text-sm">
                {product.description}
            </Text>
        </View>

        {/* 5. SPECS */}
        {specs.length > 0 && (
            <View className="bg-white px-4 py-6 mb-4">
                <Text className="text-dark text-lg font-black uppercase mb-4 border-l-4 border-primary pl-3">
                    Характеристики
                </Text>
                
                <View className="mb-4">
                    {visibleSpecs.map((spec: any, idx: number) => (
                        <SpecRow key={idx} label={spec.key} value={spec.value} />
                    ))}
                </View>

                {specs.length > 4 && (
                    <Pressable 
                        onPress={() => setShowAllSpecs(!showAllSpecs)}
                        className="border border-gray-300 py-3 rounded-sm items-center active:bg-gray-50"
                        accessibilityRole="button"
                    >
                        <Text className="text-dark font-bold text-xs uppercase">
                            {showAllSpecs ? 'Скрыть характеристики' : 'Все характеристики'}
                        </Text>
                    </Pressable>
                )}
            </View>
        )}

        {/* 6. ACCORDIONS */}
        <View className="bg-white mb-4">
             <Accordion title="Информация о доставке">
                <Text className="text-gray-600 text-sm">Бесплатная доставка при заказе от 500 000 сум.</Text>
             </Accordion>
             <Accordion title="Гарантия и возврат">
                <Text className="text-gray-600 text-sm">Гарантия 1 год. Возврат в течение 10 дней.</Text>
             </Accordion>
        </View>

        {/* 7. RELATED PRODUCTS */}
        <View className="bg-white pt-6 pb-2 mb-4">
            <Text className="text-dark text-lg font-black uppercase mb-4 px-4">
                Похожие товары
            </Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {RELATED_PRODUCTS.map((item) => (
                    <View key={item.id} className="mr-3 w-[160px]">
                        <ProductCard 
                            product={item} 
                            isFavorite={isFavorite(item.id)}
                            onToggleFavorite={() => toggleFavorite({
                                id: item.id,
                                title: item.name,
                                handle: item.id, // handle is required in Product
                                thumbnail: item.image,
                            } as any)}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>

      </ScrollView>

      {/* STICKY BOTTOM BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <SafeAreaView edges={['bottom']} className="px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
                <View>
                    {oldPrice && (
                        <Text className="text-gray-400 text-xs line-through font-medium">
                            {formatPrice(oldPrice)} сум
                        </Text>
                    )}
                    <Text className="text-dark text-xl font-black">
                        {formatPrice(price * quantity)} <Text className="text-primary text-sm">сум</Text>
                    </Text>
                </View>
                <View className="items-end">
                     <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full mr-1 ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Text className={`font-bold text-xs ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                           {inStock 
                              ? (canBackorder ? 'Предзаказ' : 'В наличии')
                              : 'Нет в наличии'}
                        </Text>
                     </View>
                     {!isOutOfStock && manageInventory && !canBackorder && (
                        <Text className="text-gray-500 text-[10px]">Осталось: {inventoryQuantity} шт.</Text>
                     )}
                </View>
            </View>

            <View className="flex-row gap-3">
                {/* Quantity Selector */}
                <View className="flex-row items-center bg-gray-100 rounded-sm">
                   <Pressable 
                      onPress={handleDecrease}
                      disabled={quantity <= 1 || isOutOfStock}
                      className={`px-4 py-3 ${quantity <= 1 ? 'opacity-30' : 'active:opacity-60'}`}
                      accessibilityLabel="Уменьшить количество"
                      accessibilityRole="button"
                   >
                     <Ionicons name="remove" size={20} color="#374151" />
                   </Pressable>
                   <Text className="font-bold text-dark text-base min-w-[20px] text-center">{quantity}</Text>
                   <Pressable 
                      onPress={handleIncrease}
                      disabled={quantity >= maxQuantity || isOutOfStock}
                      className={`px-4 py-3 ${quantity >= maxQuantity ? 'opacity-30' : 'active:opacity-60'}`}
                      accessibilityLabel="Увеличить количество"
                      accessibilityRole="button"
                   >
                     <Ionicons name="add" size={20} color="#374151" />
                   </Pressable>
                </View>

                <Pressable 
                  onPress={async () => {
                    if (!selectedVariantId) {
                        Alert.alert("Внимание", "Пожалуйста, выберите вариант товара");
                        return;
                    }
                    if (isOutOfStock) {
                        return;
                    }
                    try {
                      addItem(selectedVariantId, quantity); // Optimistic!
                      Alert.alert("Успешно", "Товар добавлен в корзину");
                    } catch (err) {
                      Alert.alert("Ошибка", "Не удалось добавить товар");
                    }
                  }}
                  disabled={!selectedVariantId || isOutOfStock}
                  className={`flex-1 rounded-sm py-3 justify-center items-center shadow-sm ${!selectedVariantId || isOutOfStock ? 'bg-gray-300' : 'bg-primary active:bg-primary-dark'}`}
                  accessibilityRole="button"
                  accessibilityLabel={
                      !selectedVariantId 
                             ? 'Выберите вариант' 
                             : isOutOfStock 
                                 ? 'Нет в наличии' 
                                 : 'В корзину'
                  }
                >
                    <Text className="text-white font-black uppercase tracking-wider text-sm">
                        {!selectedVariantId 
                          ? 'Выберите вариант' 
                          : isOutOfStock 
                              ? 'Нет в наличии' 
                              : 'В корзину'}
                    </Text>
                </Pressable>
                
                <Pressable 
                  onPress={handleToggleFavorite}
                  className={`border rounded-sm py-3 px-4 justify-center items-center active:opacity-70 ${isFav ? 'bg-red-50 border-red-200' : 'bg-gray-100 border-gray-300'}`}
                  accessibilityLabel="Добавить в избранное"
                  accessibilityRole="button"
                >
                  <Ionicons 
                      name={isFav ? "heart" : "heart-outline"} 
                      size={24} 
                      color={isFav ? "#DC2626" : "#374151"} 
                  />
                </Pressable>
            </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
