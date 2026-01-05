import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '../product-card';
import { useProducts } from '../../hooks/useProducts';
import { ProductRailSkeleton } from './skeletons';
import { LazySection } from './LazySection';
import { track } from '../../lib/analytics/track';
import { registerExperiment } from '../../lib/analytics/experiments';

interface ProductRailProps {
  collectionId: string;
  title: string;
  id?: string;
  position?: number;
  experiment?: { name: string; variant: string } | null;
}

/**
 * Main content component that performs data fetching.
 * This is only rendered once the LazySection enters the viewport.
 */
function ProductRailContent({ collectionId, title, id, position, experiment }: ProductRailProps) {
  const router = useRouter();
  const { data: products, isLoading, error } = useProducts(`collection_id[]=${collectionId}&limit=8`);

  const handleProductPress = (productId: string, productIndex: number) => {
    track('product_click', {
      product_id: productId,
      section_id: id,
      section_type: 'product_rail',
      position_in_rail: productIndex,
      experiment_context: experiment ? [experiment] : [],
    });
    router.push(`/product/${productId}`);
  };

  const handleAllPress = () => {
    track('section_click', {
      section_id: id,
      section_type: 'product_rail',
      experiment_context: experiment ? [experiment] : [],
    });
    router.push(`/catalog/${collectionId}`);
  };

  if (isLoading || error || !products?.length) {
    return <ProductRailSkeleton />;
  }

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-dark text-lg font-black uppercase tracking-wide border-l-4 border-primary pl-3">
          {title}
        </Text>
        <Pressable onPress={handleAllPress}>
            <Text className="text-primary font-bold text-xs uppercase tracking-wider">Все</Text>
        </Pressable>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {products.map((product, index) => (
          <View key={product.id} style={{ width: 160, marginRight: 12 }}>
            <ProductCard
              product={product}
              onPress={() => handleProductPress(product.id, index)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Lazy-wrapped ProductRail.
 * Defers everything (including fetching) until it's near the viewport.
 */
export function ProductRail(props: ProductRailProps) {
  const handleImpression = () => {
    if (props.experiment) registerExperiment(props.experiment.name, props.experiment.variant);

    track('section_impression', {
      section_id: props.id,
      section_type: 'product_rail',
      position: props.position,
      experiment_context: props.experiment ? [props.experiment] : [],
    });
  };

  return (
    <LazySection 
      height={300} 
      skeleton={<ProductRailSkeleton />}
      onImpression={handleImpression}
    >
      <ProductRailContent {...props} />
    </LazySection>
  );
}
