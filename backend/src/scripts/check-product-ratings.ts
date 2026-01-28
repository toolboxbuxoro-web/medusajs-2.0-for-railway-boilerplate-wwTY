/**
 * Script to check product ratings in the database
 * Run from backend directory: npx tsx src/scripts/check-product-ratings.ts
 */

import { loadEnv, Modules } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

async function main() {
  console.log("[Check Ratings] Starting...\n")

  // Import the container
  const { container } = await import("@medusajs/framework/http")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Query products with ratings
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    pagination: {
      take: 20,
    },
  })

  console.log(`[Check Ratings] Found ${products.length} products\n`)

  let productsWithRatings = 0
  let productsWithoutRatings = 0

  for (const product of products) {
    const metadata = product.metadata || {}
    const hasRating = typeof metadata.rating_avg === "number" && metadata.rating_avg > 0
    const hasCount = typeof metadata.rating_count === "number" && metadata.rating_count > 0

    if (hasRating || hasCount) {
      productsWithRatings++
      console.log(`✅ ${product.title}`)
      console.log(`   Rating: ${metadata.rating_avg || 0} (${metadata.rating_count || 0} reviews)`)
      console.log(`   Distribution:`, metadata.rating_distribution || "N/A")
      console.log("")
    } else {
      productsWithoutRatings++
    }
  }

  console.log("\n[Check Ratings] Summary:")
  console.log(`  Products with ratings: ${productsWithRatings}`)
  console.log(`  Products without ratings: ${productsWithoutRatings}`)
  console.log(`  Total products checked: ${products.length}`)

  process.exit(0)
}

main().catch((err) => {
  console.error("[Check Ratings] Error:", err)
  process.exit(1)
})

