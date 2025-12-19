import { MedusaRequest } from "@medusajs/framework/http"
import { normalizeUzPhone } from "../../../lib/phone"

export async function findCustomerByPhone(req: MedusaRequest, phone: string) {
  const logger = req.scope.resolve("logger")
  const normalized = normalizeUzPhone(phone)
  if (!normalized) return null

  const pg = req.scope.resolve("__pg_connection__") as any

  // Normalize stored phone by removing non-digits, match against normalized digits.
  const result = await pg.raw(
    `
      SELECT id, email, phone
      FROM customer
      WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = ?
      LIMIT 1
    `,
    [normalized]
  )

  const rows = result?.rows || result || []
  const customer = rows[0] || null

  if (!customer) {
    logger.warn(`[OTP] customer not found for phone=${normalized}`)
  }

  return customer
}





