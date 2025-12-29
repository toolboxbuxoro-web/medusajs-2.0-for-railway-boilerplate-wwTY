import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
  locale,
  offset = 0,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
  locale: string
  offset?: number
}) {
  return collections.map((collection, index) => (
    <li key={collection.id}>
      <ProductRail 
        collection={collection} 
        region={region} 
        locale={locale} 
        isFirst={index + offset === 0}
      />
    </li>
  ))
}
