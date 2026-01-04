import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { useState } from 'react';
import { Product } from '../types/product';
import { useFavoritesStore } from '@/store/favorites-store';

import { HighlightedText } from './ui/highlighted-text';

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
  const { isFavorite: isFavStore } = useFavoritesStore();

  const isFav = isFavorite !== undefined ? isFavorite : (product ? isFavStore(product.id) : false);

  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
  };

  // Determine display data
  const title = product.title;
  // Use thumbnail or first image
  const image = resultUrl(product.thumbnail) || resultUrl(product.images?.[0]?.url);
  
  function resultUrl(url?: string) {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      // Handle potential relative paths if necessary, though Medusa usually gives full URLs
      return url; 
  }

  // Price: try to get from first variant or cheapest
  const priceAmount = product.variants?.[0]?.prices?.[0]?.amount || 0;
  
  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    // Default logic: add first variant
    const variantId = product.variants?.[0]?.id;
    if (!variantId) {
      Alert.alert("Ошибка", "Варианты не найдены");
      return;
    }

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

  return (
    <Pressable 
      onPress={onPress}
      className="bg-white rounded-sm shadow-sm overflow-hidden mb-3 border border-gray-100 flex-1 mx-1"
    >
      <View className="relative">
        <Image
          source={image ? { uri: image } : require('../../assets/images/placeholder.png')} 
          style={{ width: '100%', height: 160 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <Pressable 
          onPress={onToggleFavorite}
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full"
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={20} 
            color={isFav ? "#DC2626" : "#4B5563"} 
          />
        </Pressable>
      </View>

      <View className="p-3">
        <HighlightedText 
          text={title}
          highlight={searchQuery || ''}
          numberOfLines={2} 
          className="text-gray-800 font-medium text-xs h-9 leading-tight mb-1"
        />
        
        <Text className="text-dark font-black text-sm mb-2">
          {formatPrice(priceAmount)}
        </Text>

        <Pressable 
          onPress={handleAddToCart}
          disabled={adding}
          className={`flex-row items-center justify-center py-2 px-3 rounded-sm ${adding ? 'bg-gray-100' : 'bg-primary active:bg-primary-dark'}`}
        >
          {adding ? (
             <ActivityIndicator size="small" color="#374151" /> 
          ) : (
             <>
                <Ionicons name="cart-outline" size={16} color="white" />
                <Text className="text-white font-bold text-xs ml-1 uppercase">В корзину</Text>
             </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}
