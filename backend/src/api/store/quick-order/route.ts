import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../lib/phone"

type Body = {
  phone: string
  first_name?: string
}

function generatePassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, first_name } = (req.body || {}) as Body

  if (!phone) {
    return res.status(400).json({ error: "phone is required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone format" })
  }

  const email = `${normalized}@phone.local`
  const password = generatePassword()

  try {
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const authModule = req.scope.resolve(Modules.AUTH) as any
    const cartModule = req.scope.resolve(Modules.CART) as any
    const orderModule = req.scope.resolve(Modules.ORDER) as any

    // Check if customer exists
    const existingCustomers = await customerModule.listCustomers({ email })
    let customer = existingCustomers?.[0]
    let isNewCustomer = false

    if (!customer) {
      // Create new customer
      isNewCustomer = true
      
      await authModule.register("emailpass", {
        body: { email, password },
      })

      customer = await customerModule.createCustomers({
        email,
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
      })
    }

    // Get cart from cookie or create minimal order
    // For quick order, we need to complete the cart that was just created
    const cartId = req.headers["x-cart-id"] as string
    
    if (!cartId) {
      return res.status(400).json({ error: "no_cart" })
    }

    // Update cart with customer info
    await cartModule.updateCarts(cartId, {
      email,
      customer_id: customer.id,
      shipping_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
      billing_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
    })

    // Complete cart to create order
    const { order } = await cartModule.completeCart(cartId)

    // Send SMS with credentials if new customer
    if (isNewCustomer) {
      const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any
      const smsMessage = `toolbox-tools.uz: Login: +${normalized}, Parol: ${password}`
      
      await notificationModule.createNotifications({
        to: normalized,
        channel: "sms",
        template: "quick-order",
        data: { message: smsMessage }
      })
    }

    logger.info(`[quick-order] Order created: ${order?.id}, customer: ${customer.id}`)

    return res.json({
      success: true,
      order_id: order?.id,
      customer_id: customer.id,
      is_new_customer: isNewCustomer,
    })

  } catch (error: any) {
    logger.error("[quick-order] Error:", error)
    return res.status(500).json({ error: error?.message || "order_failed" })
  }
}
