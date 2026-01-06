import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Mobile app uses JWT, so logout is primarily deleting the token mobile-side.
  // We return success to acknowledge the request.
  
  return res.json({ success: true, message: "Logged out successfully" })
}
