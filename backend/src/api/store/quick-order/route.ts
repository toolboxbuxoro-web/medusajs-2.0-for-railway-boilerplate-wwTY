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

    // For quick order, we create a "pending" order without payment
    // This is a Cash-on-Delivery (COD) style order
    // The order will be completed manually by the admin
    
    // First, try to get the COD payment provider or create a manual payment
    let orderId: string | undefined

    try {
      // Use the completeCartWorkflow to create the order
      const { completeCartWorkflow } = await import("@medusajs/medusa/core-flows")
      
      // First, we need to add a shipping method if not present
      if (!cart.shipping_methods?.length) {
        // Try to find any available shipping option
        const shippingOptionModule = req.scope.resolve(Modules.FULFILLMENT) as any
        const options = await shippingOptionModule.listShippingOptions({})
        
        if (options?.[0]) {
          try {
            await cartModule.addShippingMethod(cartId, {
              shipping_option_id: options[0].id,
            })
          } catch (e: any) {
            logger.warn(`[quick-order] Could not add shipping method: ${e.message}`)
          }
        } else {
          logger.warn(`[quick-order] No shipping options found for cart ${cartId}`)
        }
      }

      // Create payment collection if needed
      if (!cart.payment_collection_id) {
        try {
          // Retrieve updated cart with total
          const updatedCart = await cartModule.retrieveCart(cartId, { 
            relations: ["region"] 
          })
          
          const paymentCollection = await paymentModule.createPaymentCollections({
            amount: updatedCart.total || cart.total || 0,
            currency_code: updatedCart.currency_code || cart.currency_code || "uzs",
            region_id: updatedCart.region_id || cart.region_id,
          })
          
          await cartModule.updateCarts(cartId, {
            payment_collection_id: paymentCollection.id,
          })
          
          // Try to create a manual/COD payment session
          try {
            await paymentModule.createPaymentSession(paymentCollection.id, {
              amount: paymentCollection.amount,
              currency_code: paymentCollection.currency_code,
              provider_id: "pp_system_default", // Use system default or COD
            })
          } catch (e: any) {
            logger.warn(`[quick-order] Could not create payment session: ${e.message}`)
          }
        } catch (e: any) {
          logger.warn(`[quick-order] Could not create payment collection: ${e.message}`)
        }
      }

      // Try to complete cart using workflow
      const result = await completeCartWorkflow(req.scope).run({
        input: { id: cartId },
      })

      // The workflow returns { id: order_id } not { order: { id } }
      if (result?.result?.id) {
        orderId = result.result.id
      }
    } catch (e: any) {
      logger.error(`[quick-order] completeCartWorkflow failed: ${e.message}`)
      // If workflow fails, we'll create a simple record and notify manually
    }

    // Send SMS with credentials if new customer
    if (isNewCustomer) {
      try {
        const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any
        const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${password}`
        
        await notificationModule.createNotifications({
          to: normalized,
          channel: "sms",
          template: "quick-order-credentials",
          data: { message: smsMessage }
        })
      } catch (e: any) {
        logger.warn(`[quick-order] SMS notification failed: ${e.message}`)
      }
    }

    // Send order confirmation SMS
    if (orderId) {
      try {
        const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any
        const orderModule = req.scope.resolve(Modules.ORDER) as any
        const order = await orderModule.retrieveOrder(orderId, { relations: ["summary"] })
        
        const totalFormatted = new Intl.NumberFormat("ru-RU").format(order.total || 0)
        const smsMessage = `Vash zakaz #${order.display_id || orderId.slice(-6)} na sajte toolbox-tools.uz uspeshno oformlen. Summa: ${totalFormatted} UZS`
        
        await notificationModule.createNotifications({
          to: normalized,
          channel: "sms",
          template: "order-confirmation",
          data: { message: smsMessage }
        })
      } catch (e: any) {
        logger.warn(`[quick-order] Order SMS failed: ${e.message}`)
      }
    }

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        error: "Не удалось создать заказ автоматически. Наш менеджер свяжется с вами для оформления." 
      })
    }

    logger.info(`[quick-order] Success: order=${orderId}, customer=${customer.id}, isNew=${isNewCustomer}`)

    return res.json({
      success: true,
      order_id: orderId,
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

