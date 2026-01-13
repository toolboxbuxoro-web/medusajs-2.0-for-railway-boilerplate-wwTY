import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  order_id: model.text(),
  rating: model.number(),
  comment: model.text().nullable(),
  rejection_reason: model.text().nullable(),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
})
.indexes([
  { on: ["product_id"] },
  { on: ["status"] },
  { on: ["created_at"] },
  { on: ["product_id", "customer_id"], unique: true },
])
