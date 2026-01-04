import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryCardProps {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function CategoryCard({ name, icon, onPress }: CategoryCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl p-6 items-center justify-center shadow-sm m-2 active:bg-gray-50 border border-gray-100"
    >
      <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={32} color="#2563eb" />
      </View>
      <Text className="text-gray-900 text-base font-bold text-center">
        {name}
      </Text>
    </Pressable>
  );
}
