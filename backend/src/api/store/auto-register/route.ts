import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../lib/phone"
import { verifiedPhones } from "../otp/verify/route"

type Body = {
  phone: string
  first_name?: string
  last_name?: string
}

function generatePassword(): string {
  // Generate 6-digit numeric password
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, first_name, last_name } = (req.body || {}) as Body

  logger.info(`[auto-register] Request received: phone=${phone}, first_name=${first_name}`)

  if (!phone) {
    logger.warn(`[auto-register] Missing phone`)
    return res.status(400).json({ error: "phone is required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    logger.warn(`[auto-register] Invalid phone format: ${phone}`)
    return res.status(400).json({ error: "invalid phone format" })
  }

  // Create a technical email from phone (Medusa requires email)
  const email = `${normalized}@phone.local`
  const password = generatePassword()
  
  logger.info(`[auto-register] Normalized phone: +${normalized}, email: ${email}`)

  try {
    // Check if phone was verified via OTP (using in-memory store)
    const verifiedExpiry = verifiedPhones.get(`+${normalized}`)
    const isVerified = verifiedExpiry && verifiedExpiry > Date.now()
    
    logger.info(`[auto-register] Verification check: verifiedExpiry=${verifiedExpiry}, isVerified=${isVerified}`)
    
    if (!isVerified) {
      logger.warn(`[auto-register] Phone not verified: +${normalized}`)
      return res.status(400).json({ 
        error: "phone_not_verified",
        message: "Номер не подтверждён. Пожалуйста, подтвердите номер.",
        needs_verification: true
      })
    }

    // Check if customer already exists
    logger.info(`[auto-register] Checking if customer exists: ${email}`)
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const existingCustomers = await customerModule.listCustomers({ email })
    
    if (existingCustomers?.length > 0) {
      const existingCustomer = existingCustomers[0]
      logger.info(`[auto-register] Customer already exists: ${existingCustomer.id}`)
      // Customer exists - that's OK, continue with checkout
      // They won't get SMS with password (they already have an account)
      // But the checkout can proceed and order will be tied to this customer
      return res.json({ 
        success: true,
        already_exists: true,
        customer_id: existingCustomer.id,
        message: "Аккаунт уже существует. Заказ будет привязан к вашему аккаунту."
      })
    }

    // Register new customer
    logger.info(`[auto-register] Creating new auth identity for ${email}`)
    const authModule = req.scope.resolve(Modules.AUTH) as any
    
    // Create auth identity
    const authResult = await authModule.register("emailpass", {
      body: { email, password },
    })

    logger.info(`[auto-register] Auth register result: success=${authResult?.success}`)

    if (!authResult?.success) {
      logger.error("[auto-register] Auth registration failed", authResult)
      return res.status(500).json({ error: "registration_failed" })
    }

    // Create customer profile
    logger.info(`[auto-register] Creating customer profile`)
    const customer = await customerModule.createCustomers({
      email,
      first_name: first_name || "Покупатель",
      last_name: last_name || "",
      phone: `+${normalized}`,
    })
    
    logger.info(`[auto-register] Customer profile created: ${customer?.id}`)

    // Send SMS with login credentials
    // Format according to Eskiz requirements: resource name + purpose
    logger.info(`[auto-register] Sending credentials SMS to +${normalized}`)
    const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any
    const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${password}`
    
    await notificationModule.createNotifications({
      to: `+${normalized}`,  // Include + prefix
      channel: "sms",
      template: "auto-register",
      data: {
        message: smsMessage
      }
    })

    logger.info(`[auto-register] Customer created: ${email}, SMS sent to +${normalized}`)

    // Authenticate and get token
    const loginResult = await authModule.authenticate("emailpass", {
      body: { email, password },
    })

    if (!loginResult?.success || !loginResult?.authIdentity) {
      return res.status(500).json({ error: "login_after_register_failed" })
    }

    // Generate JWT token
    const token = await authModule.generateJwtToken(loginResult.authIdentity.id, "customer")

    return res.json({
      success: true,
      token,
      customer_id: customer?.id,
    })

  } catch (error: any) {
    logger.error("[auto-register] Error:", error)
    return res.status(500).json({ error: error?.message || "registration_failed" })
  }
}
