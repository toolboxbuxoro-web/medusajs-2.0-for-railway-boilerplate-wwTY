import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify, otpStoreConsumeVerified } from "../../../../lib/otp-store"
import { findCustomerByPhone } from "../_shared"

type Body = {
  phone: string
  code: string
  new_password: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, code, new_password } = (req.body || {}) as Body
  const purpose = "reset_password"

  if (!phone || !code || !new_password) {
    return res.status(400).json({ error: "phone_code_password_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  // Step 1: Verify OTP (this consumes the OTP code in Redis and sets the verified flag)
  const ok = await otpStoreVerify(normalized, String(code), purpose)
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  // Step 2: Consume the verification flag to prevent reuse in the same request or future ones
  const consumed = await otpStoreConsumeVerified(normalized, purpose)
  if (!consumed) {
    return res.status(400).json({ error: "expired_code" })
  }

  const customer = await findCustomerByPhone(req, phone)
  if (!customer?.email) {
    // Return success to avoid leaking customer existence if needed, 
    // but typically for reset we might want to know if it failed.
    // However, the check `findCustomerByPhone` is already done at the `request` stage for register.
    // For reset, if no customer found, we just fail gracefully.
    return res.status(400).json({ error: "customer_not_found" })
  }

  // Debug logging

  const auth = req.scope.resolve(Modules.AUTH) as any
  const logger = req.scope.resolve("logger") as any
  
  // Try to update password first (most common case)
  const updateResult = await auth.updateProvider("emailpass", {
    entity_id: customer.email,
    password: new_password,
  })

  if (!updateResult?.success) {
    // If identity does not exist — register it
    logger.info(`[RESET_PASSWORD] updateProvider failed for ${customer.email}, attempting register`)
    const registerResult = await auth.register("emailpass", {
      body: { email: customer.email, password: new_password },
    })

    if (!registerResult?.success) {
      logger.error(`[RESET_PASSWORD] register also failed for ${customer.email}`)
      return res.status(400).json({ error: "password_update_failed" })
    }
  }

  return res.json({ success: true })
}








