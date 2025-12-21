import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { generateOtpCode, otpRateLimitCheck, otpStoreSet } from "../../../../lib/otp-store"

type Body = {
  phone: string
  purpose?: "register" | "reset_password" | "change_password" | "checkout"
}

// Eskiz-approved SMS templates for each purpose
function getOtpMessage(code: string, purpose?: string): string {
  switch (purpose) {
    case "register":
      return `Kod podtverzhdeniya dlya registracii na sajte toolbox-tools.uz: ${code}`
    case "reset_password":
      return `Kod dlya vosstanovleniya parolya na sajte toolbox-tools.uz: ${code}`
    case "change_password":
      return `Kod dlya izmeneniya nomera telefona na sajte toolbox-tools.uz: ${code}`
    case "checkout":
    default:
      return `Kod podtverzhdeniya dlya oformleniya zakaza na sajte toolbox-tools.uz: ${code}`
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { phone, purpose } = (req.body || {}) as Body

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

  // Use Eskiz-approved template format based on purpose
  const message = getOtpMessage(code, purpose)

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








