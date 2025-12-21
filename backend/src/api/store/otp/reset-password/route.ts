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
  
  // Check if identity exists first
  const identities = await auth.listAuthIdentities({
    provider_identities: {
      provider_id: "emailpass",
      entity_id: customer.email,
    },
  })

  let resp;
  if (identities.length === 0) {
    // Create new identity
    resp = await auth.register("emailpass", {
       email: customer.email, 
       password: new_password 
    })
  } else {
    // Update existing
    resp = await auth.updateProvider("emailpass", {
      entity_id: customer.email,
      password: new_password,
    })
  }

  if (!resp) {
    return res.status(400).json({ error: "password_update_failed" })
  }

  return res.json({ success: true })
}








