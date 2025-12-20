import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Setup Inventory Script
 * 
 * This script:
 * 1. Creates a default stock location if none exists
 * 2. Links stock location to default sales channel
 * 3. Creates inventory items for all product variants that don't have them
 * 4. Creates inventory levels with default stock (100) for all inventory items
 * 
 * Run with: npx medusa exec ./src/scripts/setup-inventory.ts
 */
export default async function setupInventory({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const inventoryService = container.resolve(Modules.INVENTORY)
  const productService = container.resolve(Modules.PRODUCT)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("🔧 Starting inventory setup...")

  try {
    // Step 1: Get or create stock location
    let stockLocation: any
    const existingLocations = await stockLocationService.listStockLocations({})
    
    if (existingLocations.length > 0) {
      stockLocation = existingLocations[0]
      logger.info(`📍 Using existing stock location: ${stockLocation.name} (${stockLocation.id})`)
    } else {
      logger.info("📍 Creating default stock location...")
      const { result } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [{
            name: "Buxoro Warehouse",
            address: {
              address_1: "Buxoro, Uzbekistan",
              city: "Buxoro",
              country_code: "UZ",
            }
          }]
        }
      })
      stockLocation = result[0]
      logger.info(`📍 Created stock location: ${stockLocation.name} (${stockLocation.id})`)
      
      // Link to default sales channel
      const salesChannels = await salesChannelService.listSalesChannels({})
      if (salesChannels.length > 0) {
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: {
            id: stockLocation.id,
            add: salesChannels.map((sc: any) => sc.id)
          }
        })
        logger.info(`🔗 Linked stock location to ${salesChannels.length} sales channels`)
      }
    }

    // Step 2: Get all product variants that need inventory items
    logger.info("📦 Fetching product variants...")
    const variants = await productService.listProductVariants({}, {
      take: 10000, // Adjust if you have more variants
      relations: ["product"]
    })
    logger.info(`📦 Found ${variants.length} product variants`)

    // Step 3: Get existing inventory items
    const existingInventoryItems = await inventoryService.listInventoryItems({})
    const existingSkus = new Set(existingInventoryItems.map((ii: any) => ii.sku))
    logger.info(`📊 Existing inventory items: ${existingInventoryItems.length}`)

    // Step 4: Find variants that need inventory items
    const variantsNeedingInventory = variants.filter((v: any) => 
      v.sku && !existingSkus.has(v.sku)
    )
    logger.info(`🔍 Variants needing inventory items: ${variantsNeedingInventory.length}`)

    if (variantsNeedingInventory.length > 0) {
      // Create inventory items in batches
      const batchSize = 100
      let createdItems = 0
      
      for (let i = 0; i < variantsNeedingInventory.length; i += batchSize) {
        const batch = variantsNeedingInventory.slice(i, i + batchSize)
        
        try {
          const { result: createdInventoryItems } = await createInventoryItemsWorkflow(container).run({
            input: {
              items: batch.map((v: any) => ({
                sku: v.sku,
                title: v.title || v.product?.title || "Unknown",
                requires_shipping: true,
              }))
            }
          })

          // Create inventory levels for these items
          const levelInputs = createdInventoryItems.map((item: any) => ({
            inventory_item_id: item.id,
            location_id: stockLocation.id,
            stocked_quantity: 100, // Default stock
          }))

          await createInventoryLevelsWorkflow(container).run({
            input: {
              inventory_levels: levelInputs
            }
          })

          // Link variants to inventory items
          for (let j = 0; j < batch.length; j++) {
            const variant = batch[j]
            const inventoryItem = createdInventoryItems[j]
            
            await link.create({
              [Modules.PRODUCT]: {
                variant_id: variant.id
              },
              [Modules.INVENTORY]: {
                inventory_item_id: inventoryItem.id
              }
            })
          }

          createdItems += batch.length
          logger.info(`✅ Progress: ${createdItems}/${variantsNeedingInventory.length} inventory items created`)
        } catch (err: any) {
          logger.error(`❌ Error creating batch: ${err.message}`)
        }
      }

      logger.info(`✅ Created ${createdItems} inventory items with levels`)
    }

    // Step 5: Check for inventory items without levels
    logger.info("🔍 Checking for inventory items without levels...")
    const allInventoryItems = await inventoryService.listInventoryItems({})
    let levelsCreated = 0
    
    for (const item of allInventoryItems) {
      const levels = await inventoryService.listInventoryLevels({
        inventory_item_id: item.id
      })
      
      if (levels.length === 0) {
        try {
          await createInventoryLevelsWorkflow(container).run({
            input: {
              inventory_levels: [{
                inventory_item_id: item.id,
                location_id: stockLocation.id,
                stocked_quantity: 100, // Default stock
              }]
            }
          })
          levelsCreated++
        } catch (err: any) {
          logger.warn(`Could not create level for ${item.sku}: ${err.message}`)
        }
      }
    }

    if (levelsCreated > 0) {
      logger.info(`✅ Created ${levelsCreated} missing inventory levels`)
    }

    // Final summary
    const finalInventoryItems = await inventoryService.listInventoryItems({})
    const finalLevels = await inventoryService.listInventoryLevels({})
    
    logger.info("="  .repeat(50))
    logger.info("📊 INVENTORY SETUP COMPLETE")
    logger.info(`   Stock Locations: ${existingLocations.length || 1}`)
    logger.info(`   Inventory Items: ${finalInventoryItems.length}`)
    logger.info(`   Inventory Levels: ${finalLevels.length}`)
    logger.info("="  .repeat(50))

  } catch (error: any) {
    logger.error("❌ Inventory setup failed:", error.message)
    throw error
  }
}
