import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { generateOtpCode, otpRateLimitCheck, otpStoreSet, OtpPurpose } from "../../../../lib/otp-store"

type Body = {
  phone: string
  purpose: OtpPurpose
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, purpose } = (req.body || {}) as Body

  if (!phone || !purpose) {
    return res.status(400).json({ error: "phone and purpose are required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone" })
  }

  const allowed = await otpRateLimitCheck(purpose, normalized)
  if (!allowed) {
    return res.status(429).json({ error: "too_many_requests" })
  }

  const code = generateOtpCode()
  await otpStoreSet(purpose, normalized, code)

  const ttl = Number(process.env.OTP_TTL_SECONDS || 300)
  const siteName = "toolbox-tools.uz"
  let message = `${siteName}: ${code}`

  // Allow override from env if needed
  if (process.env.OTP_MESSAGE_TEMPLATE) {
    message = process.env.OTP_MESSAGE_TEMPLATE.replace("{code}", code).replace("{ttl}", String(ttl))
  }

  const notificationModule = req.scope.resolve(Modules.NOTIFICATION)

  await notificationModule.createNotifications({
    to: normalized,
    channel: "sms",
    template: "otp",
    data: {
      message
    }
  })

  return res.json({ success: true })
}




