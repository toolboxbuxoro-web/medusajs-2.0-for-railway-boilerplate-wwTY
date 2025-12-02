import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { syncMoySkladStockWorkflow } from "../../../../workflows/sync-moysklad-stock"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as any
    const events = body.events || []

    console.log(`Received MoySklad webhook with ${events.length} events`)

    const promises = events.map(async (event: any) => {
      // We expect 'code' to be the SKU.
      // If MoySklad sends 'code' in the webhook payload (which it does for some configurations), we use it.
      // Otherwise, we might need to fetch the entity. For now, we rely on 'code'.
      const sku = event.code

      if (sku) {
        console.log(`Processing stock sync for SKU: ${sku}`)
        try {
          const { result } = await syncMoySkladStockWorkflow(req.scope).run({
            input: { sku }
          })
          console.log(`Sync result for ${sku}:`, result)
        } catch (err) {
          console.error(`Failed to sync stock for SKU ${sku}:`, err)
        }
      } else {
        console.warn("Skipping event without SKU (code):", event)
      }
    })

    await Promise.all(promises)

    res.sendStatus(200)
  } catch (error) {
    console.error("Error processing MoySklad webhook:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
