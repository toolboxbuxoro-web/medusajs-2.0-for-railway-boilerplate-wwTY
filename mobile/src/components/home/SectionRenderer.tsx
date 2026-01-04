import React from 'react';
import { View, Text } from 'react-native';
import { HomeSection, HomeBanner } from '../../types/mobile';

/**
 * Empty placeholders for now, containing zero networking logic.
 */

const BannerSliderSection = ({ banners }: { banners: HomeBanner[] }) => (
  <View className="mb-4">
    <Text className="text-gray-400 text-xs uppercase px-4 mb-2">Banner Slider Placeholder</Text>
    {/* Real logic goes here */}
  </View>
);

const CategoryChipsSection = ({ dataSource }: { dataSource: string }) => (
  <View className="mb-4">
    <Text className="text-gray-400 text-xs uppercase px-4 mb-2">Category Chips Placeholder</Text>
    {/* Real logic goes here */}
  </View>
);

const ProductRailSection = ({ collectionId, title }: { collectionId: string, title: { ru: string, uz: string } }) => (
  <View className="mb-4">
    <Text className="text-gray-400 text-xs uppercase px-4 mb-2">{title.ru} Rail Placeholder</Text>
    {/* Real logic goes here */}
  </View>
);

interface SectionRendererProps {
  section: HomeSection;
}

/**
 * Generic Section Renderer
 * This component MUST NOT fetch data.
 * It is safe against unknown or unsupported section types.
 */
export function SectionRenderer({ section }: SectionRendererProps) {
  switch (section.type) {
    case 'banner_slider':
      return <BannerSliderSection banners={section.data} />;

    case 'category_chips':
      return <CategoryChipsSection dataSource={section.data_source} />;

    case 'product_rail':
      return <ProductRailSection collectionId={section.collection_id} title={section.title} />;

    default:
      // Unsupported types return null and never throw.
      return null;
  }
}
