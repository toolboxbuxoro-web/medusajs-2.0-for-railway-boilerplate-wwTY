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

  if (!phone || !code || !new_password) {
    return res.status(400).json({ error: "phone, code, new_password are required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone" })
  }

  // Step 1: Verify OTP (this consumes the OTP code)
  const ok = await otpStoreVerify(normalized, String(code))
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  // Step 2: Consume the verification flag to prevent reuse
  await otpStoreConsumeVerified(normalized)

  const customer = await findCustomerByPhone(req, phone)
  if (!customer?.email) {
    // Do not leak existence
    return res.status(400).json({ error: "invalid_request" })
  }

  const auth = req.scope.resolve(Modules.AUTH) as any
  const resp = await auth.updateProvider("emailpass", {
    entity_id: customer.email,
    password: new_password,
  })

  if (!resp?.success) {
    return res.status(400).json({ error: resp?.error || "failed" })
  }

  return res.json({ success: true })
}








