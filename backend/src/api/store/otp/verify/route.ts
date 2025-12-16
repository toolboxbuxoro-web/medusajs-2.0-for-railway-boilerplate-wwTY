import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify, OtpPurpose } from "../../../../lib/otp-store"

type Body = {
  phone: string
  purpose: OtpPurpose
  code: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, purpose, code } = (req.body || {}) as Body

  if (!phone || !purpose || !code) {
    return res.status(400).json({ error: "phone, purpose and code are required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid phone" })
  }

  const ok = await otpStoreVerify(purpose, normalized, String(code))
  if (!ok) {
    return res.status(400).json({ verified: false })
  }

  return res.json({ verified: true })
}



