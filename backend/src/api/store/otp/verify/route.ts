import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify } from "../../../../lib/otp-store"

/**
 * POST /store/otp/verify
 * Verify OTP code for phone number
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, code } = req.body as { phone?: string; code?: string }

  if (!phone || !code) {
    return res.status(400).json({ error: "Phone and code are required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "Invalid phone number format" })
  }

  try {
    // Redis-based atomic verification (Lua script)
    // 1. Checks otp:{phone}
    // 2. If match: deletes otp:{phone} AND sets otp_verified:{phone} (TTL 30m)
    const success = await otpStoreVerify(normalized, code.trim())
    
    if (!success) {
       return res.status(400).json({ 
        error: "OTP expired or invalid code. Please try again.",
      })
    }

    logger.info(`[OTP] Phone ${normalized} verified successfully`)

    return res.json({ 
      success: true, 
      verified: true,
      phone: normalized
    })

  } catch (error: any) {
    logger.error(`[OTP] Error verifying OTP: ${error.message}`)
    return res.status(500).json({ error: "Verification failed. Please try again." })
  }
}




