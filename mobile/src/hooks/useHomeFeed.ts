import { useQuery } from '@tanstack/react-query';
import { mobileService } from '../services/mobile.service';
import { HomeFeedRes } from '../types/mobile';

export function useHomeFeed() {
  return useQuery<HomeFeedRes, Error>({
    queryKey: ['mobile', 'home-feed'],
    queryFn: () => mobileService.getHomeFeed(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
