import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';

export function useProducts(queryParams?: string) {
  return useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productService.getProducts(queryParams),
    enabled: true,
  });
}
