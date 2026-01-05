import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProductRatingProps {
  rating: number;
  reviewCount: number;
  size?: 'small' | 'medium';
}

export function ProductRating({ rating, reviewCount, size = 'small' }: ProductRatingProps) {
  if (!rating && !reviewCount) return null;

  const starSize = size === 'small' ? 12 : 14;
  const displayRating = rating || 0;

  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center bg-yellow-50 px-1.5 py-0.5 rounded-sm mr-1.5">
        <Ionicons name="star" size={starSize} color="#D97706" />
        <Text className="text-yellow-800 font-bold ml-0.5" style={{ fontSize: size === 'small' ? 10 : 11 }}>
          {displayRating.toFixed(1)}
        </Text>
      </View>
      {reviewCount > 0 && (
        <Text className="text-gray-400" style={{ fontSize: size === 'small' ? 9 : 10 }}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
}
