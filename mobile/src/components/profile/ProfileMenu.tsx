import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, destructive }: MenuItemProps) {
  return (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center py-4 px-4 bg-white active:bg-gray-50 border-b border-gray-50"
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${destructive ? 'bg-red-50' : 'bg-gray-50'}`}>
        <Ionicons name={icon} size={22} color={destructive ? "#DC2626" : "#374151"} />
      </View>
      <Text className={`flex-1 text-base font-medium ${destructive ? 'text-red-500' : 'text-gray-900'}`}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#E5E7EB" />
    </Pressable>
  );
}

export function ProfileMenu() {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  return (
    <View className="mt-4">
      {/* Auth-only sections */}
      {isAuthenticated && (
        <View className="mb-4">
          <Text className="px-4 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">Активность</Text>
          <MenuItem 
            icon="list" 
            label="Мои заказы" 
            onPress={() => console.log('Navigate to /orders')} 
          />
        </View>
      )}

      <View className="mb-4">
        <Text className="px-4 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">Общее</Text>
        <MenuItem 
          icon="notifications-outline" 
          label="Уведомления" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="settings-outline" 
          label="Настройки" 
          onPress={() => {}} 
        />
      </View>

      <View className="mb-4">
        <Text className="px-4 mb-2 text-gray-400 text-xs font-bold uppercase tracking-widest">Поддержка</Text>
        <MenuItem 
          icon="help-circle-outline" 
          label="Помощь" 
          onPress={() => {}} 
        />
        <MenuItem 
          icon="information-circle-outline" 
          label="О приложении" 
          onPress={() => {}} 
        />
      </View>

      {isAuthenticated && (
        <View className="mt-4 mb-8">
          <MenuItem 
            icon="log-out-outline" 
            label="Выйти" 
            onPress={logout} 
            destructive
          />
        </View>
      )}
    </View>
  );
}
