import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { syncMoySkladStockWorkflow } from "../workflows/sync-moysklad-stock"

export default async function syncStockOnCreate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)

  try {
    // Fetch the variant to get the SKU
    const variant = await productModuleService.retrieveProductVariant(data.id)

    if (!variant.sku) {
      logger.info(`Skipping MoySklad sync for new variant ${variant.id}: No SKU`)
      return
    }

    logger.info(`New variant created: ${variant.sku}. Syncing stock from MoySklad...`)

    // Trigger the sync workflow
    const { result } = await syncMoySkladStockWorkflow(container).run({
      input: {
        sku: variant.sku
      }
    })

    if (result.updated) {
      logger.info(`Successfully synced stock for new variant ${variant.sku}: ${result.newQuantity}`)
    } else {
      logger.warn(`Failed to sync stock for new variant ${variant.sku}: ${result.reason}`)
    }

  } catch (error) {
    logger.error(`Error syncing stock for new variant ${data.id}`, error)
  }
}

export const config: SubscriberConfig = {
  event: "product-variant.created",
}
