import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "../modules/moysklad"
import MoySkladService from "../modules/moysklad/service"

/**
 * MoySklad Stock Sync Job
 * 
 * Runs every 15 minutes to sync all product stock from MoySklad to Medusa.
 * Uses bulk API to efficiently fetch all products in batches of 1000.
 */
export default async function syncMoySkladStockJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)

  const startTime = Date.now()
  logger.info("🔄 Starting MoySklad stock sync job...")

  try {
    // Step 1: Fetch ALL stock from MoySklad in bulk (efficient - ~6 API calls for 5712 products)
    logger.info("Fetching stock from MoySklad API...")
    const moySkladStock = await moySkladService.retrieveAllStock()
    logger.info(`Received ${moySkladStock.size} products from MoySklad`)

    // Step 2: Fetch ALL Medusa variants with pagination
    const allVariants: { id: string; sku: string | null }[] = []
    const pageSize = 500
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const [variants, count] = await productModuleService.listAndCountProductVariants(
        {},
        {
          take: pageSize,
          skip: offset,
          select: ["id", "sku"]
        }
      )
      
      allVariants.push(...variants.filter(v => v.sku))
      offset += pageSize
      hasMore = variants.length === pageSize
      
      if (allVariants.length % 1000 === 0 || !hasMore) {
        logger.info(`Loaded ${allVariants.length} Medusa variants...`)
      }
    }

    logger.info(`Total Medusa variants with SKU: ${allVariants.length}`)

    // Step 3: Match and update inventory
    let updatedCount = 0
    let skippedCount = 0
    let notFoundCount = 0
    let errorCount = 0

    // Process in batches for memory efficiency
    const batchSize = 100
    for (let i = 0; i < allVariants.length; i += batchSize) {
      const batch = allVariants.slice(i, i + batchSize)
      
      const updatePromises = batch.map(async (variant) => {
        const sku = variant.sku!
        const moySkladQuantity = moySkladStock.get(sku)

        if (moySkladQuantity === undefined) {
          notFoundCount++
          return
        }

        try {
          // Get inventory item by SKU
          const inventoryItems = await inventoryService.listInventoryItems({ sku })
          
          if (!inventoryItems.length) {
            skippedCount++
            return
          }

          const inventoryItem = inventoryItems[0]
          
          // Get inventory levels
          const inventoryLevels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItem.id
          })

          if (!inventoryLevels.length) {
            skippedCount++
            return
          }

          const level = inventoryLevels[0]
          const currentQuantity = level.stocked_quantity || 0

          // Only update if quantity changed
          if (currentQuantity !== moySkladQuantity) {
            await inventoryService.updateInventoryLevels([
              {
                inventory_item_id: level.inventory_item_id,
                location_id: level.location_id,
                stocked_quantity: moySkladQuantity
              }
            ])
            updatedCount++
            
            if (updatedCount <= 10) {
              logger.info(`Updated SKU ${sku}: ${currentQuantity} → ${moySkladQuantity}`)
            }
          } else {
            skippedCount++
          }

        } catch (err) {
          errorCount++
          logger.error(`Error updating SKU ${sku}:`, err)
        }
      })

      await Promise.all(updatePromises)
      
      // Log progress every 500 items
      const processed = Math.min(i + batchSize, allVariants.length)
      if (processed % 500 === 0 || processed === allVariants.length) {
        logger.info(`Progress: ${processed}/${allVariants.length} variants processed`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.info(`✅ MoySklad sync completed in ${duration}s`)
    logger.info(`   📊 Updated: ${updatedCount}`)
    logger.info(`   ⏭️  Unchanged: ${skippedCount}`)
    logger.info(`   ❓ Not in MoySklad: ${notFoundCount}`)
    logger.info(`   ❌ Errors: ${errorCount}`)

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.error(`❌ MoySklad sync failed after ${duration}s`, error)
  }
}

export const config = {
  name: "sync-moysklad-stock",
  // Run every 15 minutes
  schedule: "*/15 * * * *",
}
