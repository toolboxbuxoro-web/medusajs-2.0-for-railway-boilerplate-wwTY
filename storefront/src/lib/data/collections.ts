import { sdk } from "@lib/config"
import { cache } from "react"
import { getProductsList } from "./products"
import { HttpTypes } from "@medusajs/types"

export const retrieveCollection = cache(async function (id: string) {
  return sdk.store.collection
    .retrieve(id, {}, { next: { tags: ["collections"], revalidate: 3600 } })
    .then(({ collection }) => collection)
})

export const getCollectionsList = cache(async function (
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> {
  return sdk.store.collection
    .list({ limit, offset }, { next: { tags: ["collections"], revalidate: 3600 } })
    .then(({ collections }) => ({ collections, count: collections.length }))
})

export const getCollectionByHandle = cache(async function (
  handle: string
): Promise<HttpTypes.StoreCollection> {
  return sdk.store.collection
    .list({ handle }, { next: { tags: ["collections"], revalidate: 3600 } })
    .then(({ collections }) => collections[0])
})

export const getCollectionsWithProducts = cache(
  async (countryCode: string): Promise<HttpTypes.StoreCollection[] | null> => {
    const { collections } = await getCollectionsList(0, 3)

    if (!collections) {
      return null
    }

    const collectionPromises = collections.map(async (collection) => {
      const { response } = await getProductsList({
        queryParams: { collection_id: [collection.id], limit: 5 },
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
