import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function verifyInventory({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const inventoryService = container.resolve(Modules.INVENTORY)

  const TEST_SKU = "DRILL-18V-BASIC"

  logger.info(`Checking inventory for SKU: ${TEST_SKU}`)

  // List all inventory items
  const allItems = await inventoryService.listInventoryItems({})
  logger.info(`Total inventory items in system: ${allItems.length}`)
  
  // Check specific SKU
  const items = await inventoryService.listInventoryItems({ sku: TEST_SKU })
  logger.info(`Inventory items for ${TEST_SKU}: ${items.length}`)
  
  if (items.length > 0) {
    const item = items[0]
    logger.info(`Found item: ${item.id}, SKU: ${item.sku}`)
    
    const levels = await inventoryService.listInventoryLevels({ 
      inventory_item_id: item.id 
    })
    logger.info(`Inventory levels: ${levels.length}`)
    
    levels.forEach(level => {
      logger.info(`  Location: ${level.location_id}, Stock: ${level.stocked_quantity}`)
    })
  } else {
    logger.warn("No inventory item found!")
    
    // List all items to see what SKUs exist
    logger.info("All SKUs in system:")
    allItems.forEach(item => {
      logger.info(`  - ${item.sku} (${item.id})`)
    })
  }
}
