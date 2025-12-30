import { sdk } from "@lib/config"
import { cache } from "react"
import { getProductsList } from "./products"
import { HttpTypes } from "@medusajs/types"

export const retrieveCollection = cache(async function (id: string) {
  return sdk.store.collection
    // @ts-ignore
    .retrieve(id, {}, { next: { tags: ["collections"], revalidate: 0 } })
    .then(({ collection }) => collection)
})

export const getCollectionsList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> {
  let MEDUSA_BACKEND_URL = "http://localhost:9000"
  if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
    MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  }
  return sdk.store.collection
    // @ts-ignore
    .list({ limit, offset }, { next: { tags: ["collections"], revalidate: 0 } })
    .then(({ collections }) => {
      return { collections, count: collections.length }
    })
})

export const getCollectionByHandle = cache(async function (
  handle: string
): Promise<HttpTypes.StoreCollection> {
  return sdk.store.collection
    // @ts-ignore
    .list({ handle }, { next: { tags: ["collections"], revalidate: 0 } })
    .then(({ collections }) => collections[0])
})

export const getCollectionsWithProducts = cache(
  async (countryCode: string): Promise<HttpTypes.StoreCollection[] | null> => {
    const { collections } = await getCollectionsList(0, 12)


    if (!collections || collections.length === 0) {
      return []
    }

    const collectionPromises = collections.map(async (collection) => {
      console.log(`[Collections Debug] Fetching products for collection: ${collection.title} (${collection.id})`)
      const { response } = await getProductsList({
        // @ts-ignore
        queryParams: { collection_id: [collection.id], limit: 12 },
        countryCode,
      })

      console.log(`[Collections Debug] Collection: ${collection.title}, Products found: ${response.products.length}`)

      return {
        ...collection,
        products: response.products,
      } as unknown as HttpTypes.StoreCollection
    })

    const collectionsWithProducts = await Promise.all(collectionPromises)

    return collectionsWithProducts
  }
)
