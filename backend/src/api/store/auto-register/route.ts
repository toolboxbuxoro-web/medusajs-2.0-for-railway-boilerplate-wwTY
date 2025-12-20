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

  if (!phone) {
    return res.status(400).json({ error: "phone is required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone format" })
  }

  // Create a technical email from phone (Medusa requires email)
  const email = `${normalized}@phone.local`
  const password = generatePassword()

  try {
    // Check if phone was verified via OTP (using in-memory store)
    const verifiedExpiry = verifiedPhones.get(`+${normalized}`)
    const isVerified = verifiedExpiry && verifiedExpiry > Date.now()
    
    if (!isVerified) {
      return res.status(400).json({ 
        error: "phone_not_verified",
        message: "Номер не подтверждён. Пожалуйста, подтвердите номер.",
        needs_verification: true
      })
    }

    // Check if customer already exists
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const existingCustomers = await customerModule.listCustomers({ email })
    
    if (existingCustomers?.length > 0) {
      // Customer exists, just authenticate
      const authModule = req.scope.resolve(Modules.AUTH) as any
      const authResult = await authModule.authenticate("emailpass", {
        body: { email, password: "" }, // We don't know the password
      })
      
      // If exists, return error - they should login
      return res.status(409).json({ 
        error: "customer_exists",
        message: "Аккаунт уже существует. Пожалуйста, войдите." 
      })
    }

    // Register new customer
    const authModule = req.scope.resolve(Modules.AUTH) as any
    
    // Create auth identity
    const authResult = await authModule.register("emailpass", {
      body: { email, password },
    })

    if (!authResult?.success) {
      logger.error("[auto-register] Auth registration failed", authResult)
      return res.status(500).json({ error: "registration_failed" })
    }

    // Create customer profile
    const customer = await customerModule.createCustomers({
      email,
      first_name: first_name || "Покупатель",
      last_name: last_name || "",
      phone: `+${normalized}`,
    })

    // Send SMS with login credentials
    // Format according to Eskiz requirements: resource name + purpose
    const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any
    const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${password}`
    
    await notificationModule.createNotifications({
      to: normalized,
      channel: "sms",
      template: "auto-register",
      data: {
        message: smsMessage
      }
    })

    logger.info(`[auto-register] Customer created: ${email}, SMS sent to ${normalized}`)

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
