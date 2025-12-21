import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { normalizeUzPhone } from "../../../../lib/phone"
import { otpStoreVerify, otpStoreConsumeVerified } from "../../../../lib/otp-store"

type Body = {
  phone: string
  code: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { phone, code } = (req.body || {}) as Body
  const purpose = "change_phone"

  if (!phone || !code) {
    return res.status(400).json({ error: "phone_and_code_required" })
  }

  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  // 1. Verify OTP for the NEW phone
  const ok = await otpStoreVerify(normalized, String(code), purpose)
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  // 2. Resolve current customer from session
  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const authModule = req.scope.resolve(Modules.AUTH) as any
  
  // We assume the user is authenticated and we can get their ID from the request
  // In Medusa 2.0 with the default auth, the customer_id is usually in app_metadata
  const authIdentityId = (req as any).auth_context?.auth_identity_id
  
  if (!authIdentityId) {
    return res.status(401).json({ error: "unauthorized" })
  }

  try {
    const authIdentity = await authModule.retrieveAuthIdentity(authIdentityId)
    const customerId = authIdentity.app_metadata?.customer_id

    if (!customerId) {
      return res.status(400).json({ error: "customer_not_found" })
    }

    const newEmail = `${normalized}@phone.local`

    // 3. Check if the new phone/email already exists
    const existing = await customerModule.listCustomers({ email: newEmail })
    if (existing.length > 0) {
      return res.status(400).json({ error: "phone_already_in_use" })
    }

    // 4. Atomic Consumption of OTP
    await otpStoreConsumeVerified(normalized, purpose)

    // 5. Update Customer
    await customerModule.updateCustomers(customerId, {
      phone: `+${normalized}`,
      email: newEmail
    })

    // 6. Update Auth Identity
    await authModule.updateProvider("emailpass", {
      entity_id: authIdentity.provider_identities[0].entity_id, // old email
      update_entity_id: newEmail // new email
    })

    return res.json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: "operation_failed" })
  }
}
