import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "../modules/moysklad/constants"
import MoySkladService from "../modules/moysklad/service"

/**
 * Subscriber that runs when a new product variant is created.
 * 
 * Automatically:
 * 1. Creates an inventory item for the variant
 * 2. Creates an inventory level at the default stock location
 * 3. Syncs stock quantity from MoySklad (if SKU exists there)
 * 
 * This ensures that newly added products can be immediately added to cart.
 */
export default async function syncStockOnCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)

  try {
    // Fetch the variant to get details
    const variant = await productModuleService.retrieveProductVariant(data.id, {
      relations: ["product"]
    })

    if (!variant.sku) {
      logger.info(`[InventorySetup] Skipping variant ${variant.id}: No SKU`)
      return
    }

    logger.info(`[InventorySetup] Processing new variant: ${variant.sku}`)

    // Step 1: Check if inventory item already exists
    const existingItems = await inventoryService.listInventoryItems({ sku: variant.sku })
    
    if (existingItems.length > 0) {
      logger.info(`[InventorySetup] Inventory item already exists for SKU ${variant.sku}`)
      return
    }

    // Step 2: Get or create stock location
    let stockLocation: any
    const existingLocations = await stockLocationService.listStockLocations({})
    
    if (existingLocations.length > 0) {
      stockLocation = existingLocations[0]
    } else {
      // Create default stock location
      const [createdLocation] = await stockLocationService.createStockLocations([{
        name: "Buxoro Warehouse",
        address: {
          address_1: "Buxoro, Uzbekistan",
          city: "Buxoro",
          country_code: "UZ",
        }
      }])
      stockLocation = createdLocation
      logger.info(`[InventorySetup] Created stock location: ${stockLocation.id}`)
    }

    // Step 3: Get stock quantity from MoySklad (if available)
    let stockQuantity = 100 // Default stock
    try {
      const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)
      const moySkladStock = await moySkladService.retrieveStockBySku(variant.sku)
      if (moySkladStock > 0) {
        stockQuantity = moySkladStock
        logger.info(`[InventorySetup] Got stock from MoySklad: ${stockQuantity}`)
      }
    } catch (err) {
      logger.warn(`[InventorySetup] Could not fetch MoySklad stock for ${variant.sku}, using default`)
    }

    // Step 4: Create inventory item
    const [inventoryItem] = await inventoryService.createInventoryItems([{
      sku: variant.sku,
      title: variant.title || (variant as any).product?.title || "Product",
      requires_shipping: true,
    }])
    
    logger.info(`[InventorySetup] Created inventory item: ${inventoryItem.id}`)

    // Step 5: Create inventory level
    await inventoryService.createInventoryLevels([{
      inventory_item_id: inventoryItem.id,
      location_id: stockLocation.id,
      stocked_quantity: stockQuantity,
    }])
    
    logger.info(`[InventorySetup] Created inventory level with stock: ${stockQuantity}`)

    // Step 6: Link variant to inventory item
    await link.create({
      [Modules.PRODUCT]: {
        variant_id: variant.id
      },
      [Modules.INVENTORY]: {
        inventory_item_id: inventoryItem.id
      }
    })

    logger.info(`[InventorySetup] ✅ Complete for ${variant.sku}: inventory ${inventoryItem.id}, stock ${stockQuantity}`)

  } catch (error) {
    logger.error(`[InventorySetup] Error for variant ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
}

