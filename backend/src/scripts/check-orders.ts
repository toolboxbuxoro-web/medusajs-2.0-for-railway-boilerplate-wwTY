import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

export default async function ({ container }) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)

  try {
    logger.info("🔍 Fetching orders...")
    
    // Try to list orders with minimal fields first
   const result = await orderModule.listAndCountOrders(
      {},
      {
        take: 5,
        relations: ["items"],
      }
    )

    logger.info(`Result type: ${typeof result}`)
    logger.info(`Result:`, JSON.stringify(result, null, 2))
    
    const orders = Array.isArray(result) ? result[0] : (result ? result : [])
    const count = Array.isArray(result) ? result[1] : 0

    logger.info(`Found ${count} orders total, retrieved ${orders.length} orders`)
    
    for (const order of orders) {
      logger.info(`Order ${order.id}:`)
      logger.info(`  - status: ${order.status}`)
      logger.info(`  - region_id: ${order.region_id}`)
      logger.info(`  - currency_code: ${order.currency_code}`)
      logger.info(`  - items count: ${order.items?.length || 0}`)
      
      // Check items for null/undefined
      if (order.items) {
        order.items.forEach((item: any, idx: number) => {
          logger.info(`  - item[${idx}]:`, {
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          })
        })
      }
    }

    logger.info("✅ Order check completed successfully")
  } catch (error: any) {
    logger.error("❌ Error checking orders:", error.message)
    logger.error("Stack:", error.stack)
  }
}
