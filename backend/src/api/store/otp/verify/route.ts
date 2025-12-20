import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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
  const normalizedPhone = phone.replace(/\s+/g, "").replace(/^998/, "+998")
  
  if (!/^\+998\d{9}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: "Invalid phone number format" })
  }

  try {
    const redis = req.scope.resolve("redis") as any
    const otpKey = `otp:${normalizedPhone}`
    const verifyAttemptsKey = `otp_verify_attempts:${normalizedPhone}`
    
    // Check verification attempts (max 5 per code)
    const verifyAttempts = await redis.get(verifyAttemptsKey)
    if (verifyAttempts && parseInt(verifyAttempts) >= 5) {
      // Delete the OTP to force resend
      await redis.del(otpKey)
      return res.status(429).json({ 
        error: "Too many verification attempts. Please request a new code.",
        should_resend: true
      })
    }

    // Get stored OTP
    const storedOtp = await redis.get(otpKey)
    
    if (!storedOtp) {
      return res.status(400).json({ 
        error: "OTP expired or not found. Please request a new code.",
        expired: true
      })
    }

    // Increment verify attempts
    await redis.incr(verifyAttemptsKey)
    await redis.expire(verifyAttemptsKey, 300) // Same TTL as OTP

    // Compare codes
    if (storedOtp !== code.trim()) {
      const remaining = 5 - (parseInt(verifyAttempts || "0") + 1)
      return res.status(400).json({ 
        error: "Invalid code. Please try again.",
        attempts_remaining: remaining
      })
    }

    // OTP verified successfully
    // Delete OTP and attempts
    await redis.del(otpKey)
    await redis.del(verifyAttemptsKey)
    
    // Store verified phone temporarily (1 hour) for auto-registration
    const verifiedKey = `verified_phone:${normalizedPhone}`
    await redis.set(verifiedKey, "1", "EX", 3600)

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



