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
  const logger = req.scope.resolve("logger") as any
  const { phone, code, new_password } = (req.body || {}) as Body
  const purpose = "reset_password"

  logger.info(`[RESET_PASSWORD] Step 0: Received request for phone=${phone}`)

  if (!phone || !code || !new_password) {
    logger.warn(`[RESET_PASSWORD] Missing required fields`)
    return res.status(400).json({ error: "phone_code_password_required" })
  }

  const normalized = normalizeUzPhone(phone)
  logger.info(`[RESET_PASSWORD] Step 1: Normalized phone=${normalized}`)
  
  if (!normalized) {
    return res.status(400).json({ error: "invalid_phone" })
  }

  const technicalEmail = `${normalized}@phone.local`
  logger.info(`[RESET_PASSWORD] Step 2: Technical email=${technicalEmail}`)

  // Step 1: Verify OTP (this consumes the OTP code in Redis and sets the verified flag)
  const ok = await otpStoreVerify(normalized, String(code), purpose)
  logger.info(`[RESET_PASSWORD] Step 3: OTP verify result=${ok}`)
  
  if (!ok) {
    return res.status(400).json({ error: "invalid_code" })
  }

  // Step 2: Consume the verification flag to prevent reuse in the same request or future ones
  const consumed = await otpStoreConsumeVerified(normalized, purpose)
  logger.info(`[RESET_PASSWORD] Step 4: OTP consume result=${consumed}`)
  
  if (!consumed) {
    return res.status(400).json({ error: "expired_code" })
  }

  const customer = await findCustomerByPhone(req, phone)
  logger.info(`[RESET_PASSWORD] Step 5: Customer found=${!!customer}, customer.email=${customer?.email}`)
  
  if (!customer?.email) {
    return res.status(400).json({ error: "customer_not_found" })
  }

  // CRITICAL: Check if customer.email matches our expected technical email
  logger.info(`[RESET_PASSWORD] Step 6: Comparing emails - customer.email="${customer.email}" vs technicalEmail="${technicalEmail}"`)
  if (customer.email !== technicalEmail) {
    logger.warn(`[RESET_PASSWORD] EMAIL MISMATCH! customer.email="${customer.email}" !== technicalEmail="${technicalEmail}"`)
  }

  const auth = req.scope.resolve(Modules.AUTH) as any
  
  // Try to update password first (most common case)
  logger.info(`[RESET_PASSWORD] Step 7: Calling updateProvider for entity_id=${customer.email}`)
  const updateResult = await auth.updateProvider("emailpass", {
    entity_id: customer.email,
    password: new_password,
  })
  logger.info(`[RESET_PASSWORD] Step 8: updateProvider result=${JSON.stringify(updateResult)}`)

  if (!updateResult?.success) {
    // If identity does not exist — register it
    logger.info(`[RESET_PASSWORD] Step 9: updateProvider failed, attempting register for email=${customer.email}`)
    const registerResult = await auth.register("emailpass", {
      body: { email: customer.email, password: new_password },
    })
    logger.info(`[RESET_PASSWORD] Step 10: register result=${JSON.stringify(registerResult)}`)

    if (!registerResult?.success) {
      logger.error(`[RESET_PASSWORD] Step 11: BOTH updateProvider AND register FAILED for ${customer.email}`)
      return res.status(400).json({ error: "password_update_failed" })
    }
  }

  logger.info(`[RESET_PASSWORD] Step 12: SUCCESS - Password updated for ${customer.email}`)
  return res.json({ success: true })
}








