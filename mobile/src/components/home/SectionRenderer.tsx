import React from 'react';
import { View, Text } from 'react-native';
import { HomeSection, HomeBanner } from '../../types/mobile';

/**
 * Empty placeholders for now, containing zero networking logic.
 */

import { BannerSlider } from './BannerSlider';
import { CategoryChips } from './CategoryChips';
import { ProductRail } from './ProductRail';

interface SectionRendererProps {
  section: HomeSection;
  index: number;
}

export function SectionRenderer({ section, index }: SectionRendererProps) {
  const commonProps = {
    id: section.id,
    position: index,
    experiment: (section as any)._experiment,
  };

  switch (section.type) {
    case 'banner_slider':
      return <BannerSlider banners={section.data} {...commonProps} />;

    case 'category_chips':
      return <CategoryChips {...commonProps} />;

    case 'product_rail':
      return (
        <ProductRail 
          collectionId={section.collection_id} 
          title={section.title.ru} 
          {...commonProps}
        />
      );

    default:
      return null;
  }
}
