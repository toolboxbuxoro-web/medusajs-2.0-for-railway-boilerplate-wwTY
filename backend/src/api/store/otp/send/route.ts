import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
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
  const normalizedPhone = phone.replace(/\s+/g, "").replace(/^998/, "+998")
  
  if (!/^\+998\d{9}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: "Invalid phone number format. Use +998XXXXXXXXX" })
  }

  try {
    // Generate 4-digit OTP code
    const otpCode = crypto.randomInt(1000, 9999).toString()
    
    // Store OTP in Redis with 5 minute TTL
    const redis = req.scope.resolve("redis") as any
    const otpKey = `otp:${normalizedPhone}`
    const attemptsKey = `otp_attempts:${normalizedPhone}`
    
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
    
    // Send SMS via Eskiz
    const notificationService = req.scope.resolve("notification") as any
    
    // Format message according to Eskiz requirements:
    // Must include: 1) resource name (site), 2) purpose of code
    await notificationService.createNotifications({
      to: normalizedPhone,
      channel: "sms",
      template: "otp-verification",
      data: {
        message: `Kod podtverzhdeniya dlya registracii na sajte toolbox-tools.uz: ${otpCode}`
      }
    })

    logger.info(`[OTP] Sent code to ${normalizedPhone}`)
    
    return res.json({ 
      success: true, 
      message: "OTP sent successfully",
      phone: normalizedPhone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 ** *** ** $5") // Mask phone
    })

  } catch (error: any) {
    logger.error(`[OTP] Error sending OTP: ${error.message}`)
    return res.status(500).json({ error: "Failed to send OTP. Please try again." })
  }
}
