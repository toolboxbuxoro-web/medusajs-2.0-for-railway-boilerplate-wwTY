import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  author_device: model.text().nullable(),
  rating: model.number(),
  comment: model.text().nullable(),
})
.indexes([
  { on: ["product_id"] },
  { on: ["product_id", "customer_id"], unique: true }
])
