import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    // Subscribe to changes
    const unsub = NetInfo.addEventListener(state => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return unsub;
  }, []);

  return online;
}
