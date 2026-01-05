import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from '../../ui/skeleton';

interface ProductRailSkeletonProps {
  itemCount?: number;
}

export function ProductRailSkeleton({ itemCount = 4 }: ProductRailSkeletonProps) {
  return (
    <View className="mt-6 px-2">
      <View className="flex-row items-center justify-between px-2 mb-4">
        {/* Title placeholder */}
        <Skeleton width={140} height={24} borderRadius={4} />
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {[...Array(itemCount)].map((_, i) => (
          <View key={i} className="mx-1" style={{ width: 160 }}>
            {/* Image Placeholder */}
            <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 12 }} />
            {/* Title Placeholder Line 1 */}
            <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            {/* Title Placeholder Line 2 */}
            <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
            {/* Price Placeholder */}
            <Skeleton width="50%" height={20} borderRadius={4} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
