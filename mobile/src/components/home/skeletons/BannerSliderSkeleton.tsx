import React from 'react';
import { View, ScrollView } from 'react-native';
import { Skeleton } from '../../ui/skeleton';

export function BannerSliderSkeleton() {
  return (
    <View className="mt-4 px-4">
      <Skeleton 
        width="100%" 
        style={{ aspectRatio: 16 / 9 }} 
        borderRadius={12} 
      />
    </View>
  );
}
