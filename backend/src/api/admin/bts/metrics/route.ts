import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BtsApiService } from "../../../../lib/bts-api"

/**
 * GET /admin/bts/metrics - Get BTS API metrics for monitoring
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const metrics = BtsApiService.getMetrics()
    const circuitBreaker = BtsApiService.getCircuitBreakerStatus()

    return res.json({
      metrics,
      circuitBreaker,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}

/**
 * POST /admin/bts/metrics - Reset BTS API metrics
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    BtsApiService.resetMetrics()
    return res.json({ success: true, message: "Metrics reset" })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}
