import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../../lib/phone"
import { otpStoreConsumeVerified, otpStoreVerify } from "../../../../../lib/otp-store"
import { JWT_SECRET } from "../../../../../lib/constants"
import * as jwt from "jsonwebtoken"

type Body = {
  phone: string
  code: string
  cart_id?: string
}

function generatePassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, code, cart_id } = (req.body || {}) as Body
  const purpose = "checkout"

  if (!phone || !code) {
    return res.status(400).json({ error: "phone_and_code_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  try {
    /**
     * 1. Verify OTP
     */
    const isVerified = await otpStoreVerify(normalized, code.trim(), purpose)
    if (!isVerified) {
      return res.status(401).json({ error: "invalid_code_or_expired" })
    }

    const authModule = req.scope.resolve(Modules.AUTH) as any
    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any

    const email = `${normalized}@phone.local`
    
    /**
     * 2. Find Auth Identity First
     */
    let authIdentityId: string | null = null
    const identities = await authModule.listAuthIdentities({
      provider_identities: {
        entity_id: email,
        provider: "emailpass",
      },
    })
    authIdentityId = identities[0]?.id

    /**
     * 3. Find or Create Customer
     */
    let customer: any
    const existingCustomers = await customerModule.listCustomers({ email })

    if (existingCustomers.length > 0) {
      customer = existingCustomers[0]
      
      // Update phone/name if missing (fix legacy data)
      if (!customer.phone || !customer.first_name) {
        customer = await customerModule.updateCustomers(customer.id, {
          phone: customer.phone || `+${normalized}`,
          first_name: customer.first_name || "Покупатель",
        })
        logger.info(`[Mobile Auth] Updated legacy customer ${customer.id} with phone/name`)
      }
    } else {
      // Register New Customer in Module
      try {
        customer = await customerModule.createCustomers({
          email,
          phone: `+${normalized}`,
          first_name: "Покупатель",
          has_account: true,
        })
        logger.info(`[Mobile Auth] Customer created: ${customer.id}`)
      } catch (custErr: any) {
        logger.error(`[Mobile Auth] Customer creation failed: ${custErr.message}`)
        throw custErr
      }
    }

    /**
     * 4. Register Auth Identity if missing
     */
    if (!authIdentityId) {
      const password = generatePassword()
      logger.info(`[Mobile Auth] Registering new auth identity for ${email}`)
      try {
        const registerResult = await authModule.register("emailpass", {
          body: { email, password },
        })

        if (!registerResult?.success) {
          logger.error(`[Mobile Auth] Registration failed for ${email}: ${JSON.stringify(registerResult)}`)
          throw new Error("registration_failed")
        }

        authIdentityId = registerResult.authIdentity.id
        logger.info(`[Mobile Auth] Identity created: ${authIdentityId}`)
      } catch (regErr: any) {
        logger.error(`[Mobile Auth] Auth register call failed: ${regErr.message}`)
        throw regErr
      }
    }

    /**
     * 5. Link Customer to Auth Identity (always ensure link)
     */
    const identity = await authModule.retrieveAuthIdentity(authIdentityId)
    if (!identity.app_metadata?.customer_id) {
      try {
        await authModule.updateAuthIdentities([
          {
            id: authIdentityId,
            app_metadata: {
              ...(identity.app_metadata || {}),
              customer_id: customer.id,
            },
          },
        ])
        logger.info(`[Mobile Auth] Identity linked to customer ${customer.id}`)
      } catch (linkErr: any) {
        logger.error(`[Mobile Auth] Identity linking failed: ${linkErr.message}`)
        throw linkErr
      }
    }

    if (!authIdentityId) {
       throw new Error("failed_to_resolve_auth_identity")
    }

    /**
     * 3. Bind Cart to Customer (if cart_id provided)
     */
    if (cart_id) {
      try {
        const cartModule = req.scope.resolve(Modules.CART)
        await cartModule.updateCarts(cart_id, {
          customer_id: customer.id,
          email: customer.email,
        })
        logger.info(`[Mobile Auth] Bound cart ${cart_id} to customer ${customer.id}`)
      } catch (err: any) {
        logger.warn(`[Mobile Auth] Failed to bind cart ${cart_id}: ${err.message}`)
      }
    }

    /**
     * 4. Issue JWT Token
     * We follow Medusa 2.0 JWT format for Store API compatibility
     */
    const token = jwt.sign(
      {
        actor_id: customer.id,
        auth_identity_id: authIdentityId,
        actor_type: "customer",
        domain: "store",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    logger.info(`[Mobile Auth] User ${normalized} logged in successfully`)

    return res.json({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name: customer.first_name,
        last_name: customer.last_name,
      }
    })

  } catch (error: any) {
    logger.error(`[Mobile Auth] Verification Error: ${error.message}`)
    console.error(`[Mobile Auth] Error details:`, error)
    return res.status(500).json({ 
      error: "authentication_failed",
      message: error.message
    })
  }
}
