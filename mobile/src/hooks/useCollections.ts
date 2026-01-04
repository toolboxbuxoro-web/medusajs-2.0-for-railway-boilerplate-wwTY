import { useQuery } from '@tanstack/react-query';
import { collectionService } from '../services/collection.service';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionService.getCollections(),
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionService.getCollection(id),
    enabled: !!id,
  });
}
