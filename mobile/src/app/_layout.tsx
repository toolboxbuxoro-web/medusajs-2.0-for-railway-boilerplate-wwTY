import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "../../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 min
      gcTime: 10 * 60 * 1000,       // 10 min (React Query v5 uses gcTime instead of cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="catalog/[category]" options={{ headerShown: true }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="checkout" options={{ headerShown: true }} />
      </Stack>
    </QueryClientProvider>
  );
}
