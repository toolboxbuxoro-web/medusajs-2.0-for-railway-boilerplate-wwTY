import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkProductData({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const pricingService = container.resolve(Modules.PRICING)
  const promotionService = container.resolve(Modules.PROMOTION)

  const SEARCH_TITLE = "Cordless Drill 18V"

  logger.info(`Searching for product: "${SEARCH_TITLE}"...`)

  const products = await productModuleService.listProducts({
    title: SEARCH_TITLE
  }, {
    relations: ["variants"]
  })

  if (products.length === 0) {
    logger.warn("Product not found!")
    return
  }

  const product = products[0]
  logger.info(`Found Product: ${product.title} (ID: ${product.id})`)

  for (const variant of product.variants) {
    logger.info(`--- Variant: ${variant.title} (SKU: ${variant.sku}) ---`)
    
    // Check Inventory
    const [inventoryItems] = await inventoryService.listInventoryItems({ sku: variant.sku })
    if (inventoryItems.length > 0) {
      const levels = await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItems[0].id })
      if (levels.length > 0) {
        logger.info(`Stock: ${levels[0].stocked_quantity} (Location: ${levels[0].location_id})`)
      } else {
        logger.warn("No inventory levels found.")
      }
    } else {
      logger.warn("No inventory item found for this SKU.")
    }

    // Check Prices (Basic check, real price calculation is complex)
    // We can't easily check calculated price without a context (cart/region), 
    // but we can check if prices exist.
    // In Medusa v2, prices are in the Pricing Module, linked by price_set_id on the variant? 
    // Actually, product variants have a price_set linked.
    
    // Note: In Medusa v2, we need to look up the price set.
    // But for a quick check, let's see if we can find promotions.
  }

  // Check Active Promotions
  const promotions = await promotionService.listPromotions({
    status: ["active"]
  })
  
  logger.info(`Active Promotions count: ${promotions.length}`)
  if (promotions.length > 0) {
    promotions.forEach(p => logger.info(`- Promotion: ${p.code} (${p.type})`))
  }
}
