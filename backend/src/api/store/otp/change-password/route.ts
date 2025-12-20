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

  if (!phone || !code || !old_password || !new_password) {
    return res.status(400).json({ error: "phone, code, old_password, new_password are required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone" })
  }

  const ok = await otpStoreVerify("change_password", normalized, String(code))
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  const customer = await findCustomerByPhone(req, phone)
  if (!customer?.email) {
    return res.status(400).json({ error: "invalid_request" })
  }

  const auth = req.scope.resolve(Modules.AUTH) as any

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
    return res.status(400).json({ error: updateResp?.error || "failed" })
  }

  return res.json({ success: true })
}






