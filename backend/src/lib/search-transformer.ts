/**
 * Transforms a Medusa product into a rich search document for Meilisearch.
 * 
 * We flatten critical metadata fields (brand, title_uz, etc.) into 
 * top-level attributes to ensure they are correctly indexed and 
 * rankable by Meilisearch.
 */
export function transformProductToSearchDocument(product: any) {
  const metadata = product.metadata || {}
  
  // Extract and normalize basic info
  const doc = {
    id: product.id,
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    handle: product.handle,
    thumbnail: product.thumbnail,
    status: product.status,
    created_at: product.created_at,
    updated_at: product.updated_at,
    
    // Flattened metadata for better search/ranking
    brand: metadata.brand || "",
    title_uz: metadata.title_uz || "",
    seo_keywords: metadata.seo_keywords || "",
    
    // Inventory and pricing (if available)
    in_stock: metadata.in_stock ?? true,
    price: metadata.price || null,
    sales_count: metadata.sales_count || 0,
    rating_avg: metadata.rating_avg || 0,
    rating_count: metadata.rating_count || 0,
    
    // Categories
    categories: product.categories?.map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.handle
    })) || [],
    
    // Variant info
    variant_sku: product.variants?.[0]?.sku || "",
    
    // Original metadata for fallback
    metadata: metadata
  }

  return doc
}
