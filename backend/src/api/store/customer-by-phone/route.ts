import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { findCustomerByPhone } from "../otp/_shared"

/**
 * Public route to resolve a phone number to an email.
 * Used by the storefront login flow to support legacy users who have real emails.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { phone } = req.query as { phone: string }

  if (!phone) {
    return res.status(400).json({ error: "phone_required" })
  }

  try {
    const customer = await findCustomerByPhone(req, phone)
    
    if (!customer) {
      return res.json({ found: false })
    }

    return res.json({ 
      found: true, 
      email: customer.email,
      phone: customer.phone // optional, but matches what we found
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
