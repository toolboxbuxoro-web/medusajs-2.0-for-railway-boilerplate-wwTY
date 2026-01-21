import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BtsApiService } from "../../../../lib/bts-api"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  
  try {
    const btsApi = new BtsApiService(logger)
    const cities = await btsApi.getCities()
    
    return res.json({
      cities
    })
  } catch (e: any) {
    logger?.error?.(`[store/bts/cities] Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}
