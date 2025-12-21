import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"

export default async function main({ container }) {
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const [orders] = await orderModuleService.listAndCountOrders(
    {},
    { take: 1, order: { created_at: "DESC" } }
  )

  if (orders.length > 0) {
    console.log(`LATEST_ORDER_ID=${orders[0].id}`)
    console.log(`DISPLAY_ID=${orders[0].display_id}`)
  } else {
    console.log("No orders found.")
  }
}
