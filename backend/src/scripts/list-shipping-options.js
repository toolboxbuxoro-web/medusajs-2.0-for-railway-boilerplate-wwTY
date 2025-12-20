
import { Modules } from "@medusajs/framework/utils"

export default async function listShippingOptions({ container }) {
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
    const options = await fulfillmentModule.listShippingOptions({})
    console.log(JSON.stringify(options, null, 2))
}
