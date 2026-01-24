import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BtsApiService } from "../../../../lib/bts-api"

/**
 * GET /store/bts/branches
 * Fetches dynamic list of BTS branches grouped by region
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const btsApi = new BtsApiService(logger)
    const branches = await btsApi.getBranches()
    
    return res.json({
      branches
    })
  } catch (e: any) {
    logger?.error?.(`[store/bts/branches] Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}
