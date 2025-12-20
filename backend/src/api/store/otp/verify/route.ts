import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { otpStore } from "../send/route"

// Verified phones storage (valid for 1 hour)
const verifiedPhones = new Map<string, number>()

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

  // Normalize phone number
  let normalizedPhone = phone.replace(/[\s\-\(\)]/g, "")
  
  if (normalizedPhone.startsWith("+")) {
    normalizedPhone = normalizedPhone
  } else if (normalizedPhone.startsWith("998")) {
    normalizedPhone = "+" + normalizedPhone
  } else if (normalizedPhone.startsWith("8") && normalizedPhone.length === 10) {
    normalizedPhone = "+998" + normalizedPhone.slice(1)
  } else if (/^\d{9}$/.test(normalizedPhone)) {
    normalizedPhone = "+998" + normalizedPhone
  }
  
  if (!/^\+998\d{9}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: "Invalid phone number format" })
  }

  try {
    // Get stored OTP
    const stored = otpStore.get(normalizedPhone)
    
    if (!stored) {
      return res.status(400).json({ 
        error: "OTP expired or not found. Please request a new code.",
        expired: true
      })
    }

    // Check if OTP expired
    if (stored.expires < Date.now()) {
      otpStore.delete(normalizedPhone)
      return res.status(400).json({ 
        error: "OTP expired. Please request a new code.",
        expired: true
      })
    }

    // Compare codes
    if (stored.code !== code.trim()) {
      return res.status(400).json({ 
        error: "Invalid code. Please try again.",
      })
    }

    // OTP verified successfully
    // Delete OTP
    otpStore.delete(normalizedPhone)
    
    // Store verified phone (valid for 1 hour)
    verifiedPhones.set(normalizedPhone, Date.now() + 60 * 60 * 1000)

    logger.info(`[OTP] Phone ${normalizedPhone} verified successfully`)

    return res.json({ 
      success: true, 
      verified: true,
      phone: normalizedPhone
    })

  } catch (error: any) {
    logger.error(`[OTP] Error verifying OTP: ${error.message}`)
    return res.status(500).json({ error: "Verification failed. Please try again." })
  }
}

// Export for auto-register to check
export { verifiedPhones }




