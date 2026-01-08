import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ClickMerchantService } from "../../../modules/payment-click/services/click-merchant"

function parseIncomingParams(req: MedusaRequest): Record<string, any> {
  const body: any = (req as any).body
  let parsedBody: Record<string, any> = {}

  if (typeof body === "string") {
    parsedBody = Object.fromEntries(new URLSearchParams(body))
  } else if (body && typeof body === "object") {
    parsedBody = body
  }

  // Click sends POST, sometimes parameters may also appear in querystring
  const query = (req as any).query || {}
  return { ...query, ...parsedBody }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const clickMerchant = new ClickMerchantService({
      logger: req.scope.resolve("logger"),
      container: req.scope,
    })

    const params = parseIncomingParams(req)
    const result = await clickMerchant.handlePrepare(params)

    return res.json(result)
  } catch (e) {
    console.error("[Click Prepare] Fatal error:", e)
    // Always return a valid Click-spec JSON to avoid error -8
    const body = (req as any).body || {}
    return res.json({
      click_trans_id: Number(body.click_trans_id) || 0,
      merchant_trans_id: String(body.merchant_trans_id || ""),
      merchant_prepare_id: 0,
      error: -8,
      error_note: "Internal Server Error",
    })
  }
}















