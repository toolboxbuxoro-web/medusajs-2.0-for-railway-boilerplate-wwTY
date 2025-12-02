import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function addStockToAllProducts({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)

  logger.info("Starting to add stock to all products...")

  // 1. Get or create a stock location
  const locations = await stockLocationService.listStockLocations({}, { take: 1 })
  
  let locationId = ""
  if (locations.length === 0) {
    logger.info("No stock location found. Creating one...")
    const location = await stockLocationService.createStockLocations({ name: "Main Warehouse" })
    locationId = location.id
  } else {
    locationId = locations[0].id
    logger.info(`Using stock location: ${locations[0].name} (${locationId})`)
  }

  // 2. Get all product variants
  const variants = await productModuleService.listProductVariants({}, {
    select: ["id", "sku", "title"]
  })

  logger.info(`Found ${variants.length} variants to process.`)

  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const variant of variants) {
    if (!variant.sku) {
      logger.debug(`Skipping variant ${variant.id}: No SKU`)
      skippedCount++
      continue
    }

    try {
      // Check if inventory item exists
      const inventoryItems = await inventoryService.listInventoryItems({ sku: variant.sku })
      
      let inventoryItemId = ""
      
      if (inventoryItems.length === 0) {
        // Create inventory item
        const item = await inventoryService.createInventoryItems({
          sku: variant.sku
        })
        inventoryItemId = item.id
        logger.info(`Created inventory item for SKU ${variant.sku}`)
      } else {
        inventoryItemId = inventoryItems[0].id
      }

      // Check if inventory level exists
      const levels = await inventoryService.listInventoryLevels({ 
        inventory_item_id: inventoryItemId,
        location_id: locationId
      })

      if (levels.length === 0) {
        // Create inventory level with 5 units
        await inventoryService.createInventoryLevels([{
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          stocked_quantity: 5
        }])
        logger.info(`Added 5 units for SKU ${variant.sku}`)
        createdCount++
      } else {
        // Update existing level to 5
        await inventoryService.updateInventoryLevels([{
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          stocked_quantity: 5
        }])
        logger.info(`Updated stock to 5 units for SKU ${variant.sku}`)
        updatedCount++
      }

    } catch (error) {
      logger.error(`Failed to process SKU ${variant.sku}:`, error)
    }
  }

  logger.info(`Stock update completed. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)
}
