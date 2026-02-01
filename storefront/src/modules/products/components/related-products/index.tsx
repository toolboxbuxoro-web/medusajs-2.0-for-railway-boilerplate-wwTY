import Product from "../product-preview"
import { getRegion } from "@lib/data/regions"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type StoreProductParamsWithTags = HttpTypes.StoreProductParams & {
  tags?: string[]
}

type StoreProductWithTags = HttpTypes.StoreProduct & {
  tags?: { value: string }[]
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  const t = await getTranslations("product")

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: StoreProductParamsWithTags = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    (queryParams as any).collection_id = [product.collection_id]
  }
  const productWithTags = product as StoreProductWithTags
  if (productWithTags.tags) {
    queryParams.tags = productWithTags.tags
      .map((t) => t.value)
      .filter(Boolean) as string[]
  }
  (queryParams as any).is_giftcard = false

  let products = await getProductsList({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  // FALLBACK: If we didn't find enough related products, fetch generic products from the same region
  if (products.length < 4) {
     const fallbackParams: StoreProductParamsWithTags = {
       region_id: region.id,
       is_giftcard: false,
       limit: 8 // Fetch enough to fill the gap
     }
     
     const fallbackProducts = await getProductsList({
       queryParams: fallbackParams,
       countryCode,
     }).then(({ response }) => {
       return response.products.filter(
         (responseProduct) => responseProduct.id !== product.id && 
         !products.find(p => p.id === responseProduct.id) // Avoid duplicates
       )
     })
     
     products = [...products, ...fallbackProducts]
  }

  // Limit to 4 products total
  products = products.slice(0, 4)

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <p className="text-2xl-regular text-ui-fg-base max-w-lg font-semibold">
          {t("related_products")}
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            {region && <Product region={region} product={product} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
