import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

// Simple in-memory OTP storage (for environments without Redis)
const otpStore = new Map<string, { code: string; expires: number; attempts: number }>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of otpStore.entries()) {
    if (value.expires < now) {
      otpStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
    
    // Check rate limiting (max 3 sends per phone per hour)
    const existing = otpStore.get(normalizedPhone)
    if (existing && existing.attempts >= 3 && existing.expires > Date.now()) {
      return res.status(429).json({ 
        error: "Too many OTP requests. Please try again later.",
        retry_after: Math.ceil((existing.expires - Date.now()) / 1000)
      })
    }

    // Store OTP with 5 min expiry
    otpStore.set(normalizedPhone, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: (existing?.attempts || 0) + 1
    })
    
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

// Export the OTP store for verification endpoint
export { otpStore }


