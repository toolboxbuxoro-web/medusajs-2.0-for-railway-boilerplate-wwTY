"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"
import { getProductsById } from "./products"
import { omit } from "lodash"
import { HttpTypes } from "@medusajs/types"

export const retrieveOrder = cache(async function (id: string) {
  return sdk.store.order
    .retrieve(
      id,
      { fields: "*payment_collections.payments,+metadata,*fulfillments,*fulfillments.labels,+region_id" },
      { next: { tags: ["order"], revalidate: 60 }, ...await getAuthHeaders() }
    )
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
})

export async function listOrders(
  limit: number = 10,
  offset: number = 0
) {
  return sdk.store.order
    .list({ limit, offset, fields: "+metadata,*fulfillments,*fulfillments.labels,+region_id" }, { next: { tags: ["order"] }, ...await getAuthHeaders() })
    .then(async ({ orders }) => {
      if (!orders?.length) {
        return orders
      }

      // Enrich line items with product+variant details so UI can localize titles (UZ) from product metadata.
      // We batch by region_id to keep pricing/product retrieval consistent.
      const byRegion = new Map<string, HttpTypes.StoreOrder[]>()

      for (const order of orders as HttpTypes.StoreOrder[]) {
        const regionId = (order as any).region_id as string | undefined
        if (!regionId) {
          continue
        }
        const arr = byRegion.get(regionId) || []
        arr.push(order as HttpTypes.StoreOrder)
        byRegion.set(regionId, arr)
      }

      const enrichedOrders: HttpTypes.StoreOrder[] = orders as HttpTypes.StoreOrder[]

      for (const [regionId, regionOrders] of Array.from(byRegion.entries())) {
        const allProductIds = Array.from(
          new Set(
            regionOrders
              .flatMap((o: HttpTypes.StoreOrder) => (o.items || []).map((i: HttpTypes.StoreOrderLineItem) => i.product_id).filter(Boolean) as string[])
          )
        )

        if (!allProductIds.length) continue

        const products = await getProductsById({ ids: allProductIds, regionId })

        for (const order of regionOrders) {
          if (!order.items?.length) continue

          order.items = order.items.map((item: any) => {
            const product = products?.find((p: any) => p.id === item.product_id)
            const variant = product?.variants?.find((v: any) => v.id === item.variant_id)

            if (!product || !variant) {
              return item
            }

            return {
              ...item,
              variant: {
                ...variant,
                product: omit(product, "variants"),
              },
            }
          }) as any
        }
      }

      // Sort orders by created_at descending (newest first) to ensure consistent ordering
      // across all consumers (Orders page and Recent Orders section)
      const sorted = [...enrichedOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return sorted
    })
    .catch((err) => medusaError(err))
}
