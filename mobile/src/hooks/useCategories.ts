import { useQuery } from '@tanstack/react-query';
import { categoryService, ProductCategory } from '../services/category.service';

export function useCategories(queryParams: string = '') {
  return useQuery<ProductCategory[], Error>({
    queryKey: ['categories', queryParams],
    queryFn: () => categoryService.getCategories(queryParams),
  });
}
