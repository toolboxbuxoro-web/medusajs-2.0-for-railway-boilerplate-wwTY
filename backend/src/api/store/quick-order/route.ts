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

  // Get cart ID from header (sent by storefront)
  const cartId = req.headers["x-cart-id"] as string
  
  if (!cartId) {
    return res.status(400).json({ error: "Корзина пуста. Добавьте товар в корзину." })
  }

  try {
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const authModule = req.scope.resolve(Modules.AUTH) as any
    const cartModule = req.scope.resolve(Modules.CART) as any
    const paymentModule = req.scope.resolve(Modules.PAYMENT) as any

    // Check if customer exists
    const existingCustomers = await customerModule.listCustomers({ email })
    let customer = existingCustomers?.[0]
    let isNewCustomer = false

    if (!customer) {
      // Create new customer
      isNewCustomer = true
      
      try {
        await authModule.register("emailpass", {
          body: { email, password },
        })
      } catch (e: any) {
        // If user already exists in auth, that's ok
        if (!e.message?.includes("already exists")) {
          logger.warn(`[quick-order] Auth register warning: ${e.message}`)
        }
      }

      customer = await customerModule.createCustomers({
        email,
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
      })
    }

    // Get existing cart using remoteQuery (more robust in Medusa 2.0)
    let cart: any
    try {
      const remoteQuery = req.scope.resolve("remoteQuery")
      
      const carts = await remoteQuery({
        entryPoint: "cart",
        fields: [
          "id", 
          "currency_code", 
          "region_id", 
          "total", 
          "payment_collection_id",
          "items.id",
          "items.variant_id",
          "items.quantity",
          "items.unit_price",
          "items.total",
          "items.title",
          "region.id",
          "region.name",
          "region.currency_code",
          "shipping_methods.id",
          "shipping_methods.shipping_option_id",
          "shipping_methods.amount"
        ],
        variables: { id: cartId }
      })
      
      cart = carts?.[0]
      
      if (!cart) {
        logger.error(`[quick-order] Cart not found with remoteQuery: ${cartId}`)
        return res.status(400).json({ error: "Корзина не найдена. Пожалуйста, попробуйте добавить товар еще раз." })
      }
    } catch (e: any) {
      logger.error(`[quick-order] Error retrieving cart ${cartId}: ${e.message}`)
      return res.status(400).json({ error: "Ошибка при чтении корзины" })
    }

    if (!cart.items?.length) {
      logger.warn(`[quick-order] Cart ${cartId} has no items`)
      return res.status(400).json({ error: "Корзина пуста" })
    }

    // Update cart with customer info and address
    await cartModule.updateCarts(cartId, {
      email,
      customer_id: customer.id,
      shipping_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен при звонке",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
      billing_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен при звонке",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
    })

    // Generate password if new or reset if needed (we'll need it for the SMS)
    // We store it in cart metadata to send it later after order is placed
    if (isNewCustomer) {
      // Update cart with metadata containing the password
      // This is temporary storage so we can email/SMS it after checkout
      await cartModule.updateCarts(cartId, {
         metadata: {
           ...cart.metadata,
           tmp_generated_password: password,
           is_quick_order: true
         }
      })
    }

    // Update cart with customer info and address
    await cartModule.updateCarts(cartId, {
      email,
      customer_id: customer.id,
      shipping_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен при звонке",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
      billing_address: {
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        address_1: "Будет уточнен при звонке",
        city: "Ташкент",
        country_code: "uz",
        postal_code: "100000",
      },
    })

    // We no longer complete the order here. We just set up the cart and return success.
    // The frontend will redirect to checkout.
    
    logger.info(`[quick-order] Initialized cart ${cartId} for customer ${customer.id}`)

    return res.json({
      success: true,
      cart_id: cartId,
      customer_id: customer.id,
      is_new_customer: isNewCustomer,
    })

  } catch (error: any) {
    logger.error(`[quick-order] Error: ${error?.message || error}`)
    return res.status(500).json({ 
      success: false,
      error: error?.message || "Ошибка оформления заказа" 
    })
  }
}

