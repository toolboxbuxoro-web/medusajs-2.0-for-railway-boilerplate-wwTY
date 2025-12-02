import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "../modules/moysklad"
import MoySkladService from "../modules/moysklad/service"

export default async function verifyMoySkladIntegration({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)

  logger.info("Starting MoySklad integration verification...")

  // 1. Check Token
  if (!process.env.MOYSKLAD_TOKEN) {
    logger.error("MOYSKLAD_TOKEN is missing from environment variables!")
    return
  }
  logger.info("MOYSKLAD_TOKEN is present.")

  // 2. Get a sample product variant from Medusa
  const [variants, count] = await productModuleService.listAndCountProductVariants(
    {},
    { take: 1, select: ["sku", "id", "title"] }
  )

  if (count === 0) {
    logger.warn("No product variants found in Medusa. Cannot verify stock sync.")
    return
  }

  const variant = variants[0]
  logger.info(`Found Medusa Variant: ${variant.title} (ID: ${variant.id}, SKU: ${variant.sku})`)

  if (!variant.sku) {
    logger.warn("Variant has no SKU. Skipping MoySklad check.")
    return
  }

  // 3. Fetch stock from MoySklad
  try {
    logger.info(`Fetching stock for SKU: ${variant.sku} from MoySklad...`)
    const quantity = await moySkladService.retrieveStockBySku(variant.sku)
    logger.info(`SUCCESS: Retrieved stock from MoySklad. Quantity: ${quantity}`)
  } catch (error) {
    logger.error(`FAILED: Could not retrieve stock from MoySklad for SKU ${variant.sku}.`)
    logger.error(error.message)
  }
}
