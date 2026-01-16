import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../../lib/phone"
import { generateOtpCode, otpRateLimitCheck, otpStoreSet, otpCooldownCheck } from "../../../../../lib/otp-store"

type Body = {
  phone: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone } = (req.body || {}) as Body
  const purpose = "checkout"

  if (!phone) {
    return res.status(400).json({ error: "phone_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  // 1. Check Cooldown (60s)
  const isCooldownAllowed = await otpCooldownCheck(normalized, purpose)
  if (!isCooldownAllowed) {
    return res.status(429).json({ error: "otp_cooldown" })
  }

  // 2. Redis-based rate limiting (atomic INCR per hour)
  const allowed = await otpRateLimitCheck(normalized)
  if (!allowed) {
    return res.status(429).json({ error: "too_many_requests" })
  }

  const isDev = process.env.NODE_ENV === 'development'
  
  // In development mode, use a fixed code for easier testing
  const code = isDev ? "123456" : generateOtpCode()
  await otpStoreSet(normalized, code, purpose)

  // In development mode, skip SMS and return code directly
  if (isDev) {
    logger.info(`[Mobile Auth] DEV MODE: OTP code for ${normalized} is ${code}`)
    return res.json({ 
      success: true, 
      dev_code: code,
      message: "Development mode: use code 123456"
    })
  }

  const { OTP_CHECKOUT_TEXT } = await import("../../../../../modules/eskiz-sms/sms-texts.js")
  const message = OTP_CHECKOUT_TEXT.replace("{code}", code)

  try {
    const notificationModule = req.scope.resolve(Modules.NOTIFICATION)

    await notificationModule.createNotifications({
      to: `+${normalized}`,
      channel: "sms",
      template: "otp",
      data: {
        message
      }
    })

    logger.info(`[Mobile Auth] OTP sent to ${normalized} (using web template)`)
    return res.json({ success: true })
  } catch (error: any) {
    logger.error(`[Mobile Auth] Failed to send SMS: ${error.message}`)
    return res.status(500).json({ error: "failed_to_send_otp" })
  }
}
