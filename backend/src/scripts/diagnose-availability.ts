import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function diagnoseProductAvailability({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const remoteLink = container.resolve("remoteLink")

  const TEST_SKU = "DRILL-18V-BASIC"

  logger.info("=== PRODUCT AVAILABILITY DIAGNOSTIC ===")
  logger.info(`Testing SKU: ${TEST_SKU}`)

  // 1. Check Product & Variant
  logger.info("\n1. PRODUCT & VARIANT CHECK:")
  const variants = await productModuleService.listProductVariants({ sku: TEST_SKU }, {
    relations: ["product"]
  })
  
  if (variants.length === 0) {
    logger.error("❌ Variant not found!")
    return
  }
  
  const variant = variants[0]
  logger.info(`✅ Variant found: ${variant.title} (ID: ${variant.id})`)
  logger.info(`   Product: ${variant.product?.title}`)
  logger.info(`   SKU: ${variant.sku}`)

  // 2. Check Inventory Item
  logger.info("\n2. INVENTORY ITEM CHECK:")
  const inventoryItems = await inventoryService.listInventoryItems({ sku: TEST_SKU })
  
  if (inventoryItems.length === 0) {
    logger.error("❌ No inventory item found!")
    return
  }
  
  const inventoryItem = inventoryItems[0]
  logger.info(`✅ Inventory item found: ${inventoryItem.id}`)

  // 3. Check Inventory Levels
  logger.info("\n3. INVENTORY LEVELS CHECK:")
  const levels = await inventoryService.listInventoryLevels({ 
    inventory_item_id: inventoryItem.id 
  })
  
  if (levels.length === 0) {
    logger.error("❌ No inventory levels found!")
    return
  }
  
  logger.info(`✅ Found ${levels.length} inventory level(s):`)
  for (const level of levels) {
    logger.info(`   - Location: ${level.location_id}`)
    logger.info(`     Stocked: ${level.stocked_quantity}`)
    logger.info(`     Reserved: ${level.reserved_quantity || 0}`)
    logger.info(`     Available: ${level.stocked_quantity - (level.reserved_quantity || 0)}`)
  }

  // 4. Check Stock Locations
  logger.info("\n4. STOCK LOCATIONS CHECK:")
  const locations = await stockLocationService.listStockLocations({})
  logger.info(`✅ Found ${locations.length} stock location(s):`)
  for (const loc of locations) {
    logger.info(`   - ${loc.name} (${loc.id})`)
  }

  // 5. Check Sales Channels
  logger.info("\n5. SALES CHANNELS CHECK:")
  const salesChannels = await salesChannelService.listSalesChannels({})
  logger.info(`✅ Found ${salesChannels.length} sales channel(s):`)
  for (const channel of salesChannels) {
    logger.info(`   - ${channel.name} (${channel.id})`)
  }

  // 6. Check Variant-Inventory Link
  logger.info("\n6. VARIANT-INVENTORY LINK CHECK:")
  try {
    const variantInventoryLinks = await remoteLink.query({
      variant: {
        fields: ["id"],
        filters: { id: variant.id }
      },
      inventory: {
        fields: ["id", "sku"]
      }
    })
    
    if (variantInventoryLinks.length === 0) {
      logger.error("❌ No link between variant and inventory item!")
      logger.info("   This is likely the problem - variant is not linked to inventory")
    } else {
      logger.info(`✅ Variant is linked to inventory`)
      variantInventoryLinks.forEach((link: any) => {
        logger.info(`   Variant ${link.variant?.id} -> Inventory ${link.inventory?.id}`)
      })
    }
  } catch (error) {
    logger.warn("⚠️  Could not check variant-inventory link:", error.message)
  }

  // 7. Check Sales Channel-Location Link
  logger.info("\n7. SALES CHANNEL-LOCATION LINK CHECK:")
  try {
    const channelLocationLinks = await remoteLink.query({
      sales_channel: {
        fields: ["id", "name"]
      },
      stock_location: {
        fields: ["id", "name"]
      }
    })
    
    if (channelLocationLinks.length === 0) {
      logger.error("❌ No sales channels linked to stock locations!")
      logger.info("   This means products won't show as available in any channel")
    } else {
      logger.info(`✅ Found ${channelLocationLinks.length} channel-location link(s):`)
      channelLocationLinks.forEach((link: any) => {
        logger.info(`   ${link.sales_channel?.name} -> ${link.stock_location?.name}`)
      })
    }
  } catch (error) {
    logger.warn("⚠️  Could not check channel-location links:", error.message)
  }

  logger.info("\n=== DIAGNOSTIC COMPLETE ===")
}
