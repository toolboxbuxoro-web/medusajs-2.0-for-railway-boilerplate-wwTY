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
  console.log(`[Collections Debug] getCollectionsList calling: ${MEDUSA_BACKEND_URL}/store/collections?_t=${Date.now()}`)
  return sdk.store.collection
    // @ts-ignore
    .list({ limit, offset, _t: Date.now() }, { next: { tags: ["collections"], revalidate: 0 } })
    .then(({ collections }) => {
      console.log(`[Collections Debug] getCollectionsList FOUND ${collections.length} items: ${collections.map(c => c.handle).join(', ')}`)
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
    console.log(`[Collections Debug] getCollectionsWithProducts called for country: ${countryCode}`)
    const { collections } = await getCollectionsList(0, 12)

    console.log('[Collections Debug] Processing collections:', collections?.map(c => ({ title: c.title, handle: c.handle })))

    if (!collections || collections.length === 0) {
      console.log('[Collections Debug] No collections found at all!')
      return []
    }

    const collectionPromises = collections.map(async (collection) => {
      const { response } = await getProductsList({
        // @ts-ignore
        queryParams: { collection_id: [collection.id], limit: 12 },
        countryCode,
      })

      return {
        ...collection,
        products: response.products,
      } as unknown as HttpTypes.StoreCollection
    })

    const collectionsWithProducts = await Promise.all(collectionPromises)

    return collectionsWithProducts
  }
)
