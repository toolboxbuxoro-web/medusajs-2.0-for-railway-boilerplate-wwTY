import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { generateOtpCode, otpRateLimitCheck, otpStoreSet } from "../../../../lib/otp-store"

type Body = {
  phone: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone } = (req.body || {}) as Body

  if (!phone) {
    return res.status(400).json({ error: "phone is required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone" })
  }

  // Redis-based rate limiting (atomic INCR)
  const allowed = await otpRateLimitCheck(normalized)
  if (!allowed) {
    return res.status(429).json({ error: "too_many_requests" })
  }

  const code = generateOtpCode()
  await otpStoreSet(normalized, code)

  const siteName = "toolbox-tools.uz"
  const message = `${siteName}: ${code}`

  const notificationModule = req.scope.resolve(Modules.NOTIFICATION)

  try {
    await notificationModule.createNotifications({
      to: `+${normalized}`,
      channel: "sms",
      template: "otp",
      data: {
        message
      }
    })

    return res.json({ success: true })
  } catch (error: any) {
    logger.error(`[OTP] Failed to send SMS: ${error.message}`)
    return res.status(500).json({ error: "failed_to_send_otp" })
  }
}








