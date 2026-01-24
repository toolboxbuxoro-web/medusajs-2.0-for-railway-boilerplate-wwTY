import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BtsApiService } from "../../../../lib/bts-api"

/**
 * GET /store/bts/metrics
 * Returns current BTS API usage metrics
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const metrics = BtsApiService.getMetrics()
    const cbStatus = BtsApiService.getCircuitBreakerStatus()
    
    return res.json({
      metrics,
      circuit_breaker: cbStatus
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}

/**
 * DELETE /store/bts/metrics
 * Resets current BTS API usage metrics
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    BtsApiService.resetMetrics()
    
    return res.json({
      success: true,
      message: "Metrics reset successfully"
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
