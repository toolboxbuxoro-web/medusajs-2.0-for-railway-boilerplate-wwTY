import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { JWT_SECRET } from "../../../../../lib/constants"
import * as jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    const customerId = payload.actor_id

    if (!customerId) {
        return res.status(401).json({ error: "invalid_token" })
    }

    const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
    const [customer] = await customerModule.listCustomers({ id: customerId })

    if (!customer) {
      return res.status(404).json({ error: "customer_not_found" })
    }

    return res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name: customer.first_name,
        last_name: customer.last_name,
      }
    })
  } catch (err: any) {
    logger.warn(`[Mobile Auth] Me verification failed: ${err.message}`)
    return res.status(401).json({ error: "unauthorized" })
  }
}
