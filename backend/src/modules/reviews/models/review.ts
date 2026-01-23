import { model } from "@medusajs/framework/utils"

export const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  order_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  comment: model.text().nullable(),
  pros: model.text().nullable(),
  cons: model.text().nullable(),
  images: model.json().nullable(), // Array of image URLs: ["url1", "url2", ...]
  status: model
    .enum(["pending", "approved", "rejected", "hidden"])
    .default("pending"),
  rejection_reason: model.text().nullable(),
  admin_response: model.text().nullable(),
  admin_response_at: model.dateTime().nullable(),
})
.indexes([
  // Index for fast retrieval of approved reviews by product
  { on: ["product_id", "status", "created_at"] },
  // Index for customer reviews lookup
  { on: ["customer_id"] },
  // Index for order lookup
  { on: ["order_id"] },
  // Composite index for product+customer lookups
  { on: ["product_id", "customer_id"] },
])
