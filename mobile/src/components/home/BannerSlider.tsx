import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { HomeBanner } from '../../types/mobile';

const { width } = Dimensions.get('window');

interface BannerSliderProps {
  banners: HomeBanner[];
}

export function BannerSlider({ banners }: BannerSliderProps) {
  const router = useRouter();

  if (!banners.length) return null;

  return (
    <View className="mt-6">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {banners.map((banner) => (
          <Pressable
            key={banner.id}
            onPress={() => banner.action && router.push(banner.action as any)}
            className="px-4"
            style={{ width }}
          >
            <View className="rounded-sm overflow-hidden border-l-4 border-primary bg-dark h-48 relative">
              <Image
                source={banner.image}
                contentFit="cover"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                transition={200}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={['rgba(17, 24, 39, 0.8)', 'rgba(17, 24, 39, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0 p-5 justify-center"
              >
                <View className="max-w-[70%]">
                   <Text className="text-white text-2xl font-black uppercase leading-7">
                    {banner.title.ru}
                  </Text>
                  <Pressable 
                    onPress={() => banner.action && router.push(banner.action as any)}
                    className="bg-primary rounded-sm py-2 px-6 self-start mt-4 active:opacity-90"
                   >
                    <Text className="text-white font-bold text-sm uppercase tracking-wider">
                       Смотреть
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
