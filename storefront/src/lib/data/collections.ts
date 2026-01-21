import { sdk } from "@lib/config"
import { unstable_cache } from "next/cache"
import { getProductsList } from "./products"
import { HttpTypes } from "@medusajs/types"

export async function retrieveCollection(id: string) {
  return unstable_cache(
    async () => {
      return sdk.store.collection
        // @ts-ignore
        .retrieve(
          id,
          { fields: "+metadata" },
          { cache: "no-store", next: { tags: ["collections"] } }
        )
        .then(({ collection }) => collection)
    },
    [`retrieve-collection-${id}`],
    { tags: ["collections"], revalidate: 3600 }
  )()
}

export async function getCollectionsList(
  offset: number = 0,
  limit: number = 100
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> {
  return unstable_cache(
    async () => {
      return sdk.store.collection
        // @ts-ignore
        .list(
          { limit, offset, fields: "+metadata" },
          { cache: "no-store", next: { tags: ["collections"] } }
        )
        .then(({ collections }) => {
          return { collections, count: collections.length }
        })
    },
    [`get-collections-list-${offset}-${limit}`],
    { tags: ["collections"], revalidate: 3600 }
  )()
}

export async function getCollectionByHandle(
  handle: string
): Promise<HttpTypes.StoreCollection> {
  return unstable_cache(
    async () => {
      return sdk.store.collection
        // @ts-ignore
        .list(
          { handle, fields: "+metadata" },
          { cache: "no-store", next: { tags: ["collections"] } }
        )
        .then(({ collections }) => collections[0])
    },
    [`get-collection-by-handle-${handle}`],
    { tags: ["collections"], revalidate: 3600 }
  )()
}

export async function getCollectionsWithProducts(
  countryCode: string
): Promise<HttpTypes.StoreCollection[] | null> {
  return unstable_cache(
    async () => {
      const { collections } = await getCollectionsList(0, 12)

      if (!collections || collections.length === 0) {
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
          metadata: collection.metadata, // Explicitly preserve metadata
          products: response.products,
        } as unknown as HttpTypes.StoreCollection
      })

      const collectionsWithProducts = await Promise.all(collectionPromises)

      return collectionsWithProducts
    },
    [`get-collections-with-products-${countryCode}`],
    { tags: ["collections"], revalidate: 3600 }
  )()
}
