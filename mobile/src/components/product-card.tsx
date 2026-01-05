import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { useState, useMemo } from 'react';
import { Product } from '../types/product';
import { useFavoritesStore } from '@/store/favorites-store';
import { HighlightedText } from './ui/highlighted-text';
import { ProductRating } from './ui/product-rating';
import { InstallmentPrice } from './ui/installment-price';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  isFavorite?: boolean; 
  onToggleFavorite?: () => void;
  onAddToCart?: () => void;
  searchQuery?: string;
}

export function ProductCard({ product, onPress, isFavorite, onToggleFavorite, onAddToCart, searchQuery }: ProductCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const { isFavorite: isFavStore, toggleFavorite } = useFavoritesStore();

  const isFav = isFavorite !== undefined ? isFavorite : (product ? isFavStore(product.id) : false);

  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Determine display data
  const title = product.title;
  const image = resultUrl(product.thumbnail) || resultUrl(product.images?.[0]?.url);
  
  function resultUrl(url?: string) {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return url; 
  }

  // Get price from first variant using Medusa 2.0 calculated_price
  const priceAmount = useMemo(() => {
    const variant = product.variants?.[0];
    if (!variant) return 0;
    
    // Medusa 2.0 uses calculated_price based on region/context
    if (variant.calculated_price) {
      return variant.calculated_price.calculated_amount;
    }
    
    // Fallback to prices array (legacy or uncalculated)
    const uzsPrice = variant.prices?.find(p => p.currency_code?.toLowerCase() === 'uzs');
    return uzsPrice?.amount || variant.prices?.[0]?.amount || 0;
  }, [product.variants]);

  // Check stock status
  const isInStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return true;
    return product.variants.some((variant: any) => {
      if (!variant.manage_inventory) return true;
      if (variant.allow_backorder) return true;
      return (variant.inventory_quantity || 0) > 0;
    });
  }, [product.variants]);

  // Get inventory quantity for display
  const inventoryInfo = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    const variant = product.variants[0]; // Use first variant for now
    if (!variant.manage_inventory) return null; // Don't show if not managing inventory
    return {
      quantity: variant.inventory_quantity || 0,
      canBackorder: variant.allow_backorder || false,
    };
  }, [product.variants]);

  // Get metadata for rating and installment
  const rating = (product.metadata?.rating as number) || 0;
  const reviewCount = (product.metadata?.reviews_count as number) || 0;
  const hasInstallment = (product.metadata?.has_installment as boolean) || false;
  
  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      Alert.alert("Ошибка", "Варианты не найдены");
      return;
    }

    if (!isInStock) return;

    setAdding(true);
    try {
      await addItem(variantId, 1);
      Alert.alert("Успешно", "Товар добавлен в корзину");
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось добавить товар");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite();
    } else {
      toggleFavorite(product);
    }
  };

  return (
    <Pressable 
      onPress={onPress}
      className={`bg-white rounded-xl overflow-hidden mb-3 shadow-sm border border-gray-100 flex-1 mx-1 ${!isInStock ? 'opacity-80' : ''}`}
    >
      {/* Image Container */}
      <View className={`relative ${!isInStock ? 'opacity-70' : ''}`}>
        <Image
          source={image ? { uri: image } : require('../../assets/images/placeholder.png')} 
          style={{ width: '100%', aspectRatio: 3/4 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={200}
          className="bg-white"
        />
        
        {/* Favorite Button */}
        <Pressable 
          onPress={handleToggleFavorite}
          className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full shadow-md ${
            isFav ? 'bg-red-50' : 'bg-white/80'
          }`}
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={20} 
            color={isFav ? "#DC2626" : "#6B7280"} 
          />
        </Pressable>

        {/* Out of Stock Badge */}
        {!isInStock && (
          <View className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full shadow-lg">
            <Text className="text-white text-[10px] font-bold">Нет в наличии</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="p-3 flex-1">
        {/* Price */}
        <View className="mb-2 h-7 flex-row items-center">
          <Text className="text-red-600 font-black text-base">
            {formatPrice(priceAmount)}
          </Text>
          <Text className="text-red-600 text-xs ml-0.5"> сум</Text>
        </View>

        {/* Title - Fixed 3-line height */}
        <HighlightedText 
          text={title}
          highlight={searchQuery || ''}
          numberOfLines={3} 
          className="text-gray-800 font-medium text-xs leading-tight mb-2"
          style={{ minHeight: 48 }} // ~3 lines at text-xs
        />

        {/* Rating */}
        <View className="h-5 mb-1">
          <ProductRating rating={rating} reviewCount={reviewCount} size="small" />
        </View>

        {/* Stock Quantity - Only show if inventory is managed and in stock */}
        <View className="h-4 mb-1">
          {inventoryInfo && !inventoryInfo.canBackorder && inventoryInfo.quantity > 0 && inventoryInfo.quantity <= 10 && (
            <Text className="text-gray-500 text-[10px]">
              Осталось: {inventoryInfo.quantity} шт.
            </Text>
          )}
        </View>

        {/* Installment */}
        <View className="h-4 mb-2">
          {hasInstallment && priceAmount > 0 && (
            <InstallmentPrice amount={priceAmount} />
          )}
        </View>

        {/* Add to Cart Button */}
        <Pressable 
          onPress={handleAddToCart}
          disabled={adding || !isInStock}
          className={`w-full h-10 flex-row items-center justify-center rounded-lg shadow-sm ${
            isInStock 
              ? 'bg-red-600 active:bg-red-700' 
              : 'bg-gray-100'
          }`}
        >
          {adding ? (
             <ActivityIndicator size="small" color="white" /> 
          ) : (
             <>
                <Ionicons name="cart-outline" size={16} color={isInStock ? "white" : "#9CA3AF"} />
                <Text className={`font-bold text-xs ml-1 uppercase ${isInStock ? 'text-white' : 'text-gray-400'}`}>
                  {product.variants?.length === 1 ? 'В корзину' : 'Выбрать'}
                </Text>
             </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}
