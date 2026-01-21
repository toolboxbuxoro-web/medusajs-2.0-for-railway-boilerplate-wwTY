import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  order_id: model.text(),
  rating: model.number(),
  comment: model.text().nullable(),
  rejection_reason: model.text().nullable(),
  status: model
    .enum(["pending", "approved", "rejected", "hidden"])
    // By default a new review is auto-published (approved).
    // Other statuses are used for moderation via the admin panel.
    .default("approved"),
})
.indexes([
  { on: ["product_id"] },
  { on: ["status"] },
  { on: ["created_at"] },
  // Optimized index for common listing query:
  // WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC
  { on: ["product_id", "status", "created_at"] },
  { on: ["product_id", "customer_id"], unique: true },
])
