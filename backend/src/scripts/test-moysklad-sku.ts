import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { syncMoySkladStockWorkflow } from "../workflows/sync-moysklad-stock"
import { MOYSKLAD_MODULE } from "../modules/moysklad"
import MoySkladService from "../modules/moysklad/service"

export default async function testMoySkladSku({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)

  const TEST_SKU = "9207"
  const TEST_TITLE = "MoySklad Test Product"

  logger.info(`Starting test for SKU: ${TEST_SKU}...`)

  // 1. Check if product exists, if not create it
  // listProductVariants returns Promise<ProductVariantDTO[]> directly, not [variants, count]
  const variants = await productModuleService.listProductVariants({ sku: TEST_SKU })
  
  let variantId = ""

  if (variants.length === 0) {
    logger.info(`Product with SKU ${TEST_SKU} not found. Creating it...`)
    
    // We need a sales channel and shipping profile usually, but let's try minimal creation
    // Using core flow to ensure inventory items are created
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: TEST_TITLE,
          options: [{ title: "Default", values: ["Default"] }],
          variants: [{
            title: "Default Variant",
            sku: TEST_SKU,
            options: { "Default": "Default" },
            prices: [{ currency_code: "usd", amount: 1000 }]
          }]
        }]
      }
    })
    
    variantId = result[0].variants[0].id
    logger.info(`Created product variant with ID: ${variantId}`)
  } else {
    variantId = variants[0].id
    logger.info(`Product variant already exists with ID: ${variantId}`)
  }

  // Ensure Inventory Level exists
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const locations = await stockLocationService.listStockLocations({}, { take: 1 })
  
  let locationId = ""
  if (locations.length === 0) {
    logger.info("No stock location found. Creating one...")
    const location = await stockLocationService.createStockLocations({ name: "Default Location" })
    locationId = location.id
  } else {
    locationId = locations[0].id
  }

  const inventoryItems = await inventoryService.listInventoryItems({ sku: TEST_SKU })
  if (inventoryItems.length === 0) {
    logger.warn("Inventory item not found for SKU. Creating one...")
    // This shouldn't happen if product creation worked standardly, but let's handle it or just warn.
    // Actually, createProductsWorkflow should create it.
  } else {
    const inventoryItem = inventoryItems[0]
    const levels = await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItem.id })
    
    if (levels.length === 0) {
      logger.info(`Creating inventory level for item ${inventoryItem.id} at location ${locationId}`)
      await inventoryService.createInventoryLevels([{
        inventory_item_id: inventoryItem.id,
        location_id: locationId,
        stocked_quantity: 0
      }])
    }
  }

  // 2. Fetch stock from MoySklad directly to verify API
  try {
    const quantity = await moySkladService.retrieveStockBySku(TEST_SKU)
    logger.info(`MoySklad API returned quantity: ${quantity}`)
    
    // 3. Run Sync Workflow
    logger.info("Running sync workflow...")
    const { result } = await syncMoySkladStockWorkflow(container).run({
      input: { sku: TEST_SKU }
    })
    
    if (result.updated) {
      logger.info(`Workflow updated inventory. Old: ${result.oldQuantity}, New: ${result.newQuantity}`)
    } else {
      logger.warn(`Workflow did not update inventory. Reason: ${result.reason}`)
    }

    // 4. Verify in Medusa Inventory
    const inventoryItems = await inventoryService.listInventoryItems({ sku: TEST_SKU })
    if (inventoryItems.length > 0) {
      const levels = await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItems[0].id })
      if (levels.length > 0) {
        logger.info(`Final Medusa Inventory Level: ${levels[0].stocked_quantity}`)
      } else {
        logger.warn("No inventory levels found for item.")
      }
    }

  } catch (error) {
    logger.error("Error during test:", error)
  }
}
