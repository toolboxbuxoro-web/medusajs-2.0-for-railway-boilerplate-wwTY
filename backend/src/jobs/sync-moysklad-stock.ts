import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { syncMoySkladStockWorkflow } from "../workflows/sync-moysklad-stock"
import { MOYSKLAD_MODULE } from "../modules/moysklad"
import MoySkladService from "../modules/moysklad/service"

export default async function syncMoySkladStockJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)

  logger.info("Starting MoySklad stock sync job...")

  try {
    // 1. Fetch all variants with SKU
    // For simplicity, fetching first 100. Pagination should be added for production with large catalogs.
    const [variants, count] = await productModuleService.listAndCountProductVariants(
      {},
      {
        take: 100,
        select: ["sku", "id", "title"]
      }
    )

    logger.info(`Found ${count} variants to check.`)

    let updatedCount = 0
    let errorCount = 0

    for (const variant of variants) {
      if (!variant.sku) {
        continue
      }

      try {
        // 2. Get stock from MoySklad
        // We could optimize this by fetching all stock from MoySklad in one go if the API supports it,
        // but per requirements we use the existing service method.
        const quantity = await moySkladService.retrieveStockBySku(variant.sku)

        // 3. Update Medusa inventory via workflow
        const { result } = await syncMoySkladStockWorkflow(container).run({
          input: {
            sku: variant.sku
          }
        })

        if (result.updated) {
          logger.info(`Updated stock for SKU ${variant.sku}: ${result.oldQuantity} -> ${result.newQuantity}`)
          updatedCount++
        } else {
          logger.debug(`Skipped SKU ${variant.sku}: ${result.reason}`)
        }

      } catch (err) {
        logger.error(`Failed to sync SKU ${variant.sku}`, err)
        errorCount++
      }
    }

    logger.info(`MoySklad stock sync completed. Updated: ${updatedCount}, Errors: ${errorCount}`)

  } catch (error) {
    logger.error("Critical error in MoySklad stock sync job", error)
  }
}

export const config = {
  name: "sync-moysklad-stock",
  schedule: "*/30 * * * *",
}
