import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify } from "../../../../lib/otp-store"
import { findCustomerByPhone } from "../_shared"

type Body = {
  phone: string
  code: string
  old_password: string
  new_password: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, code, old_password, new_password } = (req.body || {}) as Body
  const purpose = "change_password"

  if (!phone || !code || !old_password || !new_password) {
    return res.status(400).json({ error: "phone_code_password_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  const ok = await otpStoreVerify(normalized, String(code), purpose)
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  // 2. Resolve current customer from session
  const authIdentityId = (req as any).auth_context?.auth_identity_id
  if (!authIdentityId) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const customer = await findCustomerByPhone(req, phone)
  if (!customer?.email) {
    return res.status(400).json({ error: "customer_not_found" })
  }

  const auth = req.scope.resolve(Modules.AUTH) as any

  try {
     const authResp = await auth.authenticate("emailpass", {
      body: { email: customer.email, password: old_password },
    })

    if (!authResp?.success) {
      return res.status(400).json({ error: "invalid_old_password" })
    }

    const updateResp = await auth.updateProvider("emailpass", {
      entity_id: customer.email,
      password: new_password,
    })

    if (!updateResp?.success) {
      return res.status(400).json({ error: "password_update_failed" })
    }

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(400).json({ error: "operation_failed" })
  }
}














