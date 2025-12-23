import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify } from "../../../../lib/otp-store"

/**
 * POST /store/otp/verify
 * Verify OTP code for phone number and purpose
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, code, purpose = "checkout" } = req.body as { phone?: string; code?: string; purpose?: string }

  if (!phone || !code) {
    return res.status(400).json({ error: "phone_and_code_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  try {
    // Redis-based atomic verification (Lua script)
    // 1. Checks otp:{phone}:{purpose}
    // 2. If match: deletes otp:{phone}:{purpose} AND sets otp_verified:{phone}:{purpose} (TTL 30m)
    const success = await otpStoreVerify(normalized, code.trim(), purpose)
    
    if (!success) {
       return res.status(400).json({ 
        error: "invalid_code",
      })
    }

    logger.info(`[OTP] Phone ${normalized} verified successfully for ${purpose}`)

    return res.json({ 
      success: true, 
      verified: true
    })

  } catch (error: any) {
    logger.error(`[OTP] Error verifying OTP: ${error.message}`)
    return res.status(500).json({ error: "verification_failed" })
  }
}








