import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileMenu } from '../../components/profile/ProfileMenu';
import { LastOrderCard } from '../../components/profile/LastOrderCard';
import { AuthSheet } from '../../components/auth/AuthSheet';
import { useAuthStore } from '../../store/auth-store';

export default function AccountScreen() {
  const { isAuthenticated, customer } = useAuthStore();
  const [isAuthVisible, setIsAuthVisible] = React.useState(false);

  // Orders logic: Currently we don't have a global orders store or hook.
  // We strictly follow the rule: hide "Last order" if data is missing.
  const latestOrder = null; 

  const handleLogin = () => setIsAuthVisible(true);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Stack.Screen 
        options={{
          headerTitle: "Профиль",
          headerShown: false,
        }} 
      />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <ProfileHeader onLoginPress={handleLogin} />
        
        {/* Only show if real data exists (not implemented yet) */}
        {latestOrder && <LastOrderCard order={latestOrder} />}

        <ProfileMenu />
      </ScrollView>

      <AuthSheet 
        isVisible={isAuthVisible} 
        onClose={() => setIsAuthVisible(false)} 
      />
    </SafeAreaView>
  );
}
