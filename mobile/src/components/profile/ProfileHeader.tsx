import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';

/**
 * ProfileHeader component that adapts to authentication state.
 * Displays "Guest" for unauthenticated users and name/phone for authenticated ones.
 */
interface ProfileHeaderProps {
  onLoginPress?: () => void;
}

export function ProfileHeader({ onLoginPress }: ProfileHeaderProps) {
  const { customer, isAuthenticated } = useAuthStore();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      console.log('Navigate to Edit Profile');
    } else {
      onLoginPress?.();
    }
  };

  const displayName = customer?.first_name 
    ? `${customer.first_name}${customer.last_name ? ` ${customer.last_name}` : ''}`
    : customer?.phone || 'Гость';

  return (
    <View className="bg-white px-4 py-8 flex-row items-center border-b border-gray-100">
      {/* Avatar Placeholder */}
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mr-4">
        <Ionicons 
          name={isAuthenticated ? "person" : "person-outline"} 
          size={32} 
          color={isAuthenticated ? "#DC2626" : "#9CA3AF"} 
        />
      </View>

      <View className="flex-1">
        <Text className="text-gray-900 text-xl font-bold" numberOfLines={1}>
          {displayName}
        </Text>
        
        {isAuthenticated && customer?.phone && (
          <Text className="text-gray-500 text-sm mt-0.5">
            {customer.phone}
          </Text>
        )}

        <Pressable 
          onPress={handleAuthAction}
          className="mt-2 self-start"
        >
          <Text className="text-primary font-bold text-sm">
            {isAuthenticated ? 'Редактировать' : 'Войти'}
          </Text>
        </Pressable>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
    </View>
  );
}
