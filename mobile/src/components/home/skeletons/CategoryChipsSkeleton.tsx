import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from '../../ui/skeleton';

interface CategoryChipsSkeletonProps {
  itemCount?: number;
}

export function CategoryChipsSkeleton({ itemCount = 6 }: CategoryChipsSkeletonProps) {
  return (
    <View className="mt-6">
      <View className="px-4 mb-4">
        {/* Title placeholder */}
        <Skeleton width={120} height={24} borderRadius={4} />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {[...Array(itemCount)].map((_, i) => (
          <View key={i} className="items-center mr-4 w-20">
            <Skeleton width={64} height={64} borderRadius={12} style={{ marginBottom: 8 }} />
            <Skeleton width={50} height={12} borderRadius={4} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
