"use server"

import { getProductsById } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"

export async function getFavoriteProducts(
  ids: string[],
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  if (!ids.length) {
    return []
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return []
  }

  const products = await getProductsById({
    ids,
    regionId: region.id,
  })

  return products
}
