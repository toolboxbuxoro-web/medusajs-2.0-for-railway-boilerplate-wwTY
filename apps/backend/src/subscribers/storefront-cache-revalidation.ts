import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Storefront Cache Revalidation Subscriber
 * 
 * Automatically invalidates storefront cache when products or collections
 * are created, updated, or deleted in Medusa admin.
 * 
 * This enables long cache times (1 hour) while ensuring fresh data
 * appears immediately after admin updates.
 */

const STOREFRONT_URL = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || ""

async function revalidateStorefront(tags: string[]) {
  const url = `${STOREFRONT_URL}/api/revalidate`
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATION_SECRET,
      },
      body: JSON.stringify({ tags }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`[Cache Revalidation] Success: ${tags.join(", ")}`, data)
    } else {
      console.error(`[Cache Revalidation] Failed: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    // Don't throw - we don't want to break admin operations if storefront is down
    console.error("[Cache Revalidation] Error:", error instanceof Error ? error.message : error)
  }
}

// Product events handler
export default async function storefrontCacheHandler({
  event,
}: SubscriberArgs<Record<string, unknown>>) {
  const eventName = (event as any).name || ""
  
  console.log(`[Cache Revalidation] Event received: ${eventName}`)
  
  // Determine which tags to revalidate based on event
  const tags: string[] = []
  
  if (eventName.includes("product")) {
    tags.push("products")
  }
  
  if (eventName.includes("collection")) {
    tags.push("collections")
  }
  
  if (eventName.includes("category")) {
    tags.push("categories")
  }
  
  if (tags.length > 0) {
    // Small delay to ensure database transaction is committed
    setTimeout(() => {
      revalidateStorefront(tags)
    }, 500)
  }
}

export const config: SubscriberConfig = {
  event: [
    // Product events
    "product.created",
    "product.updated",
    "product.deleted",
    // Collection events  
    "product-collection.created",
    "product-collection.updated",
    "product-collection.deleted",
    // Category events
    "product-category.created",
    "product-category.updated", 
    "product-category.deleted",
  ],
}
