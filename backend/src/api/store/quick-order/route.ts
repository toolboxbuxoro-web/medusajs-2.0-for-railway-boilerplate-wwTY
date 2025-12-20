import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
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

  const cartId = req.headers["x-cart-id"] as string
  if (!cartId) {
    return res.status(400).json({ error: "Корзина пуста. Добавьте товар в корзину." })
  }

  try {
    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const authModule = req.scope.resolve(Modules.AUTH)
    const cartModule = req.scope.resolve(Modules.CART)
    const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    // Check if customer exists by email (phone-based synthetic email)
    const existingCustomers = await customerModule.listCustomers({ email })
    let customer = existingCustomers?.[0]
    let isNewCustomer = false

    if (!customer) {
      isNewCustomer = true

      // 1. Create Auth Identity
      let authIdentityId: string | null = null
      try {
        const authResult = await authModule.register("emailpass", {
          body: { email, password },
        })
        authIdentityId = authResult?.authIdentity?.id || null
        logger.info(`[quick-order] Created auth identity: ${authIdentityId}`)
      } catch (e: any) {
        if (!e.message?.includes("already exists")) {
          logger.warn(`[quick-order] Auth register warning: ${e.message}`)
        }
      }

      // 2. Create Customer
      customer = await customerModule.createCustomers({
        email,
        first_name: first_name || "Покупатель",
        last_name: "",
        phone: `+${normalized}`,
        has_account: true,
      })
      logger.info(`[quick-order] Created customer: ${customer.id}`)

      // 3. CRITICAL: Link Auth Identity to Customer
      if (authIdentityId && customer?.id) {
        try {
          await remoteLink.create({
            [Modules.AUTH]: {
              auth_identity_id: authIdentityId,
            },
            [Modules.CUSTOMER]: {
              customer_id: customer.id,
            },
          })
          logger.info(`[quick-order] Linked auth ${authIdentityId} -> customer ${customer.id}`)
        } catch (linkError: any) {
          logger.error(`[quick-order] Failed to link auth to customer: ${linkError.message}`)
        }
      }
    }

    // Get existing cart using remoteQuery
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
          "metadata",
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

    // Prepare metadata update
    const metadataUpdate = {
        ...cart.metadata,
        is_quick_order: true,
        is_new_customer: isNewCustomer, // Track if this was a new registration
        // TEMP: Always include password for testing - will send SMS to existing users too
        tmp_generated_password: password,
    } as any

    // Update cart
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
      metadata: metadataUpdate
    })

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
