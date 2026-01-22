import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  order_id: model.text(),
  rating: model.number(),
  comment: model.text().nullable(),
  pros: model.text().nullable(),      // Marketplace: pros/advantages
  cons: model.text().nullable(),      // Marketplace: cons/disadvantages
  images: model.json().nullable(),    // Array of image URLs: ["url1", "url2", ...]
  rejection_reason: model.text().nullable(),
  status: model
    .enum(["pending", "approved", "rejected", "hidden"])
    .default("pending"),  // Changed: reviews now require moderation
})
.indexes([
  { on: ["product_id"] },
  { on: ["status"] },
  { on: ["created_at"] },
  // Optimized index for common listing query:
  // WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC
  { on: ["product_id", "status", "created_at"] },
  // Composite index for product+customer lookups (uniqueness enforced via partial unique index in migration)
  // Migration20260121130000 creates partial unique index:
  // UNIQUE (product_id, customer_id) WHERE status IN ('approved', 'pending')
  // This allows users to submit new reviews if their previous one was rejected/hidden
  { on: ["product_id", "customer_id"] },
])
