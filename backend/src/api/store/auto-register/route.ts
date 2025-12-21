import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../lib/phone"
import { otpStoreConsumeVerified } from "../../../lib/otp-store"

type Body = {
  phone: string
  first_name?: string
  last_name?: string
}

function generatePassword(): string {
  // 6-digit numeric password (SMS-friendly)
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

  const email = `${normalized}@phone.local`
  const password = generatePassword()

  try {
    /**
     * 1. Consume OTP verification (ONE-TIME, ATOMIC)
     */
    const isVerified = await otpStoreConsumeVerified(normalized)
    if (!isVerified) {
      return res.status(400).json({
        error: "phone_not_verified",
        message: "Номер не подтверждён или сессия истекла. Пожалуйста, подтвердите номер ещё раз.",
        needs_verification: true,
      })
    }

    const authModule = req.scope.resolve(Modules.AUTH) as any
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const notificationModule = req.scope.resolve(Modules.NOTIFICATION) as any

    /**
     * 2. Resolve existing customer (by phone-based email)
     */
    const existingCustomers = await customerModule.listCustomers({ email })

    let customerId: string
    let authIdentityId: string | null = null

    if (existingCustomers.length > 0) {
      /**
       * EXISTING CUSTOMER
       * → reset password
       * → guarantee SMS delivery
       */
      const customer = existingCustomers[0]
      customerId = customer.id

      // Try to update password for existing auth identity
      const updateResult = await authModule.updateProvider("emailpass", {
        entity_id: email,
        password,
      })

      if (!updateResult?.success) {
        // If identity does not exist — register it
        const registerResult = await authModule.register("emailpass", {
          body: { email, password },
        })

        if (!registerResult?.success) {
          throw new Error("auth_identity_update_failed")
        }

        authIdentityId = registerResult.authIdentity.id
      }
    } else {
      /**
       * NEW CUSTOMER
       * → create auth identity
       * → create customer
       */
      const registerResult = await authModule.register("emailpass", {
        body: { email, password },
      })

      if (!registerResult?.success) {
        throw new Error("registration_failed")
      }

      authIdentityId = registerResult.authIdentity.id

      const customer = await customerModule.createCustomers({
        email,
        first_name: first_name || "Покупатель",
        last_name: last_name || "",
        phone: `+${normalized}`,
        has_account: true,
      })

      customerId = customer.id
    }

    /**
     * 3. Ensure authIdentity ↔ customer link
     */
    if (!authIdentityId) {
      const identities = await authModule.listAuthIdentities({
        provider_identities: {
          entity_id: email,
          provider_id: "emailpass",
        },
      })

      authIdentityId = identities[0]?.id
    }

    if (authIdentityId && customerId) {
      await authModule.updateAuthIdentities([
        {
          id: authIdentityId,
          app_metadata: {
            customer_id: customerId,
          },
        },
      ])
    }

    /**
     * 4. GUARANTEE SMS DELIVERY WITH CREDENTIALS
     * If SMS fails → auto-register MUST FAIL
     */
    const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${password}`

    try {
      await notificationModule.createNotifications({
        to: `+${normalized}`,
        channel: "sms",
        template: "auto-register",
        data: {
          message: smsMessage,
        },
      })
    } catch (smsError: any) {
      logger.error(`[auto-register] SMS sending failed: ${smsError.message}`)
      return res.status(500).json({
        error: "sms_failed",
        message: "Не удалось отправить SMS с логином и паролем. Пожалуйста, попробуйте позже.",
      })
    }

    /**
     * 5. SUCCESS
     * auto-register does NOT log in the user
     * it only guarantees account + credentials delivery
     */
    return res.json({
      success: true,
      customer_id: customerId,
    })
  } catch (error: any) {
    logger.error("[auto-register] Error:", error)
    return res.status(500).json({
      error: error?.message || "registration_failed",
    })
  }
}
