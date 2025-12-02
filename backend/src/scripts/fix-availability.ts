import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"

export default async function fixProductAvailability({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const remoteQuery = container.resolve("remoteQuery")

  logger.info("=== FIXING PRODUCT AVAILABILITY ===")

  // 1. Get all sales channels and stock locations
  const salesChannels = await salesChannelService.listSalesChannels({})
  const stockLocations = await stockLocationService.listStockLocations({})

  logger.info(`Found ${salesChannels.length} sales channel(s)`)
  logger.info(`Found ${stockLocations.length} stock location(s)`)

  if (salesChannels.length === 0) {
    logger.error("❌ No sales channels found!")
    return
  }

  if (stockLocations.length === 0) {
    logger.error("❌ No stock locations found!")
    return
  }

  // 2. Link each sales channel to all stock locations
  for (const channel of salesChannels) {
    logger.info(`\nLinking sales channel "${channel.name}" to stock locations...`)
    
    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: stockLocations[0].id, // Link to the main stock location
          add: salesChannels.map(sc => sc.id)
        }
      })
      
      logger.info(`✅ Linked "${channel.name}" to "${stockLocations[0].name}"`)
    } catch (error) {
      logger.error(`❌ Failed to link "${channel.name}": ${error.message}`)
    }
  }

  // 3. Verify the links
  logger.info("\n=== VERIFYING LINKS ===")
  try {
    const links = await remoteQuery({
      sales_channel: {
        fields: ["id", "name"]
      },
      stock_location: {
        fields: ["id", "name"]
      }
    } as any)
    
    logger.info(`✅ Found ${links.length} sales channel-location link(s):`)
    links.forEach((link: any) => {
      logger.info(`   ${link.sales_channel?.name} -> ${link.stock_location?.name}`)
    })
  } catch (error) {
    logger.warn(`⚠️  Could not verify links: ${error.message}`)
  }

  logger.info("\n=== FIX COMPLETE ===")
  logger.info("Products should now be available for purchase!")
}
