import { HttpTypes } from "@medusajs/types"

/**
 * Normalized helper to extract tracking numbers from an order.
 *
 * Priority:
 * 1. Fulfillments: tracking_numbers, tracking_links[].tracking_number, and labels[].tracking_number
 * 2. Metadata fallbacks (including BTS-specific keys) when fulfillments are empty
 */
export const getTrackingNumbers = (order: HttpTypes.StoreOrder): string[] => {
  if (!order) {
    return []
  }

  const anyOrder = order as any
  const fulfillments = (anyOrder.fulfillments || []) as any[]

  const fromFulfillments = fulfillments
    .flatMap((fulfillment) => {
      const trackingNumbers = (fulfillment?.tracking_numbers || []) as any[]
      const trackingLinks = ((fulfillment?.tracking_links || []) as any[]).map(
        (l) => l?.tracking_number
      )
      const labelNumbers = ((fulfillment?.labels || []) as any[]).map(
        (l) => l?.tracking_number
      )

      return [...trackingNumbers, ...trackingLinks, ...labelNumbers]
    })
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())

  if (fromFulfillments.length > 0) {
    // Prefer explicit fulfillment tracking data when available
    return Array.from(new Set(fromFulfillments))
  }

  const metadata = (anyOrder.metadata || {}) as any
  const fromMetadata: string[] = []

  // Common simple keys
  if (typeof metadata.tracking_number === "string") {
    fromMetadata.push(metadata.tracking_number)
  }

  if (Array.isArray(metadata.tracking_numbers)) {
    fromMetadata.push(
      ...metadata.tracking_numbers.filter(
        (v: unknown): v is string =>
          typeof v === "string" && v.trim().length > 0
      )
    )
  }

  // BTS-specific or project-specific fallbacks
  if (typeof metadata.bts_tracking === "string") {
    fromMetadata.push(metadata.bts_tracking)
  }

  if (typeof metadata.bts_tracking_number === "string") {
    fromMetadata.push(metadata.bts_tracking_number)
  }

  if (
    metadata.bts_delivery &&
    typeof metadata.bts_delivery.tracking_number === "string"
  ) {
    fromMetadata.push(metadata.bts_delivery.tracking_number)
  }

  const cleanedFromMetadata = fromMetadata
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

  return Array.from(new Set(cleanedFromMetadata))
}
