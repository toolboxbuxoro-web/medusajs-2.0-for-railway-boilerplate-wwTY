import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

/**
 * POST /store/otp/send
 * Send OTP code to phone number via Eskiz SMS
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone } = req.body as { phone?: string }

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" })
  }

  // Normalize phone number (remove spaces, ensure +998 format)
  let normalizedPhone = phone.replace(/[\s\-\(\)]/g, "")
  
  // Handle various formats: 998..., +998..., 88..., etc.
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
    return res.status(400).json({ error: "Invalid phone number format. Use +998XXXXXXXXX" })
  }

  try {
    // Generate 4-digit OTP code
    const otpCode = crypto.randomInt(1000, 9999).toString()
    
    logger.info(`[OTP] Generating code for ${normalizedPhone}`)
    
    // Get Redis from cache module (Medusa 2.0 way)
    let redis: any
    try {
      const cacheModule = req.scope.resolve(Modules.CACHE) as any
      redis = cacheModule?.cacheService?.redis || cacheModule
      logger.info(`[OTP] Cache module resolved: ${typeof cacheModule}`)
    } catch (e) {
      logger.warn(`[OTP] Cache module not available, using in-memory fallback`)
      // Fallback: skip rate limiting if Redis not available
    }
    
    const otpKey = `otp:${normalizedPhone}`
    const attemptsKey = `otp_attempts:${normalizedPhone}`
    
    if (redis?.get) {
      // Check rate limiting (max 3 sends per phone per hour)
      const currentAttempts = await redis.get(attemptsKey)
      if (currentAttempts && parseInt(currentAttempts) >= 3) {
        return res.status(429).json({ 
          error: "Too many OTP requests. Please try again in 1 hour.",
          retry_after: 3600
        })
      }

      // Store OTP with 5 min expiry
      await redis.set(otpKey, otpCode, "EX", 300)
      
      // Increment attempts counter (1 hour expiry)
      await redis.incr(attemptsKey)
      await redis.expire(attemptsKey, 3600)
    } else {
      logger.warn(`[OTP] Redis not available, OTP will not be stored`)
    }
    
    // Send SMS via Eskiz
    logger.info(`[OTP] Sending SMS to ${normalizedPhone}`)
    const notificationService = req.scope.resolve(Modules.NOTIFICATION) as any
    
    if (!notificationService) {
      logger.error(`[OTP] Notification service not found`)
      return res.status(500).json({ error: "Notification service not configured" })
    }
    
    // Format message according to Eskiz requirements
    await notificationService.createNotifications({
      to: normalizedPhone,
      channel: "sms",
      template: "otp-verification",
      data: {
        message: `Kod podtverzhdeniya dlya registracii na sajte toolbox-tools.uz: ${otpCode}`
      }
    })

    logger.info(`[OTP] SMS sent successfully to ${normalizedPhone}`)
    
    return res.json({ 
      success: true, 
      message: "OTP sent successfully",
      phone: normalizedPhone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 ** *** ** $5")
    })

  } catch (error: any) {
    logger.error(`[OTP] Error: ${error.message}`)
    logger.error(`[OTP] Stack: ${error.stack}`)
    return res.status(500).json({ 
      error: "Failed to send code",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

