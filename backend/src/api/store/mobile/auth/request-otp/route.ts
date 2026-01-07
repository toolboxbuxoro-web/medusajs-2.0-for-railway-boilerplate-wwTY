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
  const purpose = "mobile_auth"

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

  const code = generateOtpCode()
  await otpStoreSet(normalized, code, purpose)

  const message = `Kod podtverzhdeniya dlya vhoda v prilozhenie Toolbox: ${code}`

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

    logger.info(`[Mobile Auth] OTP sent to ${normalized}`)
    return res.json({ success: true })
  } catch (error: any) {
    logger.error(`[Mobile Auth] Failed to send SMS: ${error.message}`)
    // For local dev, we might want to return the code in error for easier testing, but not in production
    return res.status(500).json({ 
      error: "failed_to_send_otp",
      ...(process.env.NODE_ENV === 'development' && { debug_code: code }),
      diagnostic: {
        backend_url: process.env.BACKEND_URL,
        has_eskiz_email: !!process.env.ESKIZ_EMAIL,
        has_eskiz_password: !!process.env.ESKIZ_PASSWORD,
        has_eskiz_from: !!process.env.ESKIZ_FROM,
        eskiz_from_value: process.env.ESKIZ_FROM || '4546 (default)',
        sms_provider: "eskiz", // hardcoded as per config
        node_env: process.env.NODE_ENV,
        error_details: error.message
      }
    })
  }
}
