import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { generateOtpCode, otpRateLimitCheck, otpStoreSet, otpCooldownCheck } from "../../../../lib/otp-store"
import { findCustomerByPhone } from "../_shared"

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
  const { phone, purpose = "checkout" } = (req.body || {}) as Body

  if (!phone) {
    return res.status(400).json({ error: "phone is required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  // 1. If register, check if customer already exists
  if (purpose === "register") {
    const existing = await findCustomerByPhone(req, normalized)
    if (existing) {
      return res.status(400).json({ error: "account_exists" })
    }
  }

  // 2. Check Cooldown (60s)
  const isCooldownAllowed = await otpCooldownCheck(normalized, purpose)
  if (!isCooldownAllowed) {
    return res.status(429).json({ error: "otp_cooldown" })
  }

  // 3. Redis-based rate limiting (atomic INCR per hour)
  const allowed = await otpRateLimitCheck(normalized)
  if (!allowed) {
    return res.status(429).json({ error: "too_many_requests" })
  }

  const code = generateOtpCode()
  await otpStoreSet(normalized, code, purpose)

  // Use Eskiz-approved template format based on purpose
  const message = getOtpMessage(code, purpose)

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

    return res.json({ success: true })
  } catch (error: any) {
    logger.error(`[OTP] Failed to send SMS: ${error.message}`)
    return res.status(500).json({ error: "failed_to_send_otp", debug_code: code })
  }
}









