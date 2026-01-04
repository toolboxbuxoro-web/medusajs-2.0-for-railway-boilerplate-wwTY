import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Renders product actions with fresh pricing data.
 * Always renders using the initial product as fallback if fresh fetch fails.
 * This prevents the CTA from disappearing when cache is invalidated.
 */
export default async function ProductActionsWrapper({
  product: initialProduct,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  // Start with the product passed from parent (SSR)
  let product = initialProduct
  
  // Optionally try to fetch fresh pricing data
  // If this fails (cache invalidation, timing issue), we still have initialProduct
  try {
    const [freshProduct] = await getProductsById({
      ids: [initialProduct.id],
      regionId: region.id,
    })
    
    if (freshProduct) {
      product = freshProduct
    }
  } catch (error) {
    // Log warning but continue with initial product
    console.warn('[ProductActionsWrapper] Fresh fetch failed, using initial product:', error)
  }

  return <ProductActions product={product} region={region} />
}
