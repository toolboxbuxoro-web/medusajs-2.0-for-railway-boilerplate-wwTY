import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService, IRegionModuleService } from "@medusajs/framework/types"

export default async function ({ container }) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const regionModule: IRegionModuleService = container.resolve(Modules.REGION)

  try {
    logger.info("🔍 Searching for orders with null region_id...")
    
    const pgConnection = container.resolve("__pg_connection__")
    
    // Find orders with null region_id
    const result = await pgConnection.raw(`
      SELECT id, region_id, currency_code, created_at 
      FROM "order" 
      WHERE region_id IS NULL 
      LIMIT 10
    `)

    const ordersWithNullRegion = result.rows || []
    
    logger.info(`Found ${ordersWithNullRegion.length} orders with null region_id`)

    if (ordersWithNullRegion.length === 0) {
      logger.info("✅ No orders with null region_id found")
      return
    }

    // Get the first available region
    const regions = await regionModule.listRegions({}, { take: 1 })
    
    if (regions.length === 0) {
      logger.error("❌ No regions found in the system!")
      return
    }

    const defaultRegion = regions[0]
    logger.info(`Using region ${defaultRegion.id} (${defaultRegion.name}) as default`)

    // Update each order
    for (const order of ordersWithNullRegion) {
      logger.info(`Updating order ${order.id}...`)
      
      await pgConnection.raw(`
        UPDATE "order" 
        SET region_id = ? 
        WHERE id = ?
      `, [defaultRegion.id, order.id])
      
      logger.info(`✅ Updated order ${order.id} with region_id ${defaultRegion.id}`)
    }

    logger.info(`✅ Successfully updated ${ordersWithNullRegion.length} orders`)
  } catch (error: any) {
    logger.error("❌ Error fixing orders:", error.message)
    logger.error("Stack:", error.stack)
  }
}
