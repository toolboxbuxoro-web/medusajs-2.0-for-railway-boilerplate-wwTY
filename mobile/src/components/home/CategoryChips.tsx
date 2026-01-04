import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '../../hooks/useCategories';

export function CategoryChips() {
  const { data: categories, isLoading } = useCategories('parent_id=null');

  if (isLoading || !categories?.length) return null;

  // Helper to map category names to icons (best effort)
  const getIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('дрель') || lower.includes('drill')) return 'construct-outline';
    if (lower.includes('болгарка') || lower.includes('disc')) return 'disc-outline';
    if (lower.includes('сад') || lower.includes('garden')) return 'leaf-outline';
    if (lower.includes('набор') || lower.includes('set')) return 'grid-outline';
    return 'cube-outline';
  };

  return (
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
            className="items-center mr-4 active:opacity-70 w-20"
          >
            <View className="w-16 h-16 bg-white border border-gray-200 rounded-sm items-center justify-center mb-2 shadow-sm">
              <Ionicons name={getIcon(category.name)} size={28} color="#1F2937" />
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
  );
}
