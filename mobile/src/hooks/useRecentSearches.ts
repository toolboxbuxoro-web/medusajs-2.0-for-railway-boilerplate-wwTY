import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@toolbox_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSearches = useCallback(async () => {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setSearches(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    
    setSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(err => 
        console.error('Error saving recent searches:', err)
      );
      return updated;
    });
  }, []);

  const removeSearch = useCallback(async (term: string) => {
    setSearches(prev => {
      const updated = prev.filter(s => s !== term);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(err => 
        console.error('Error removing recent search:', err)
      );
      return updated;
    });
  }, []);

  const clearSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setSearches([]);
    } catch (err) {
      console.error('Error clearing recent searches:', err);
    }
  }, []);

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

  return {
    searches,
    loading,
    addSearch,
    removeSearch,
    clearSearches,
    refresh: loadSearches,
  };
}
