import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "../modules/moysklad/constants"
import MoySkladService from "../modules/moysklad/service"

/**
 * MoySklad Price Sync Job
 * 
 * Runs every hour to sync retail prices from MoySklad to Medusa.
 * Updates variant prices based on "Розничная цена" price type from MoySklad.
 */
export default async function syncMoySkladPricesJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const productModuleService = container.resolve(Modules.PRODUCT)
  const pricingModuleService = container.resolve(Modules.PRICING)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)

  const startTime = Date.now()

  if (!process.env.MOYSKLAD_TOKEN) {
    logger.warn("⚠️  MOYSKLAD_TOKEN is not configured. Skipping price sync job.")
    return
  }

  // You can override the price type name via env var
  const priceTypeName = process.env.MOYSKLAD_RETAIL_PRICE_TYPE || "Розничная цена"

  logger.info("💰 Starting MoySklad price sync job...")
  logger.info(`   Using price type: "${priceTypeName}"`)

  try {
    // Step 1: Fetch all retail prices from MoySklad
    logger.info("Fetching retail prices from MoySklad API...")
    const moySkladPrices = await moySkladService.retrieveAllRetailPrices(priceTypeName)
    logger.info(`Received prices for ${moySkladPrices.size} products from MoySklad`)

    // Step 2: Fetch all Medusa variants with their price sets
    const allVariants: any[] = []
    const pageSize = 500
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const [variants] = await productModuleService.listAndCountProductVariants(
        {},
        {
          take: pageSize,
          skip: offset,
          select: ["id", "sku"]
        }
      )
      
      allVariants.push(...variants.filter(v => v.sku))
      offset += pageSize
      hasMore = variants.length === pageSize
      
      if (allVariants.length % 1000 === 0 || !hasMore) {
        logger.info(`Loaded ${allVariants.length} Medusa variants...`)
      }
    }

    logger.info(`Total Medusa variants with SKU: ${allVariants.length}`)

    // Step 3: Match and update prices
    let updatedCount = 0
    let createdCount = 0
    let skippedCount = 0
    let notFoundCount = 0
    let errorCount = 0

    // Process in batches
    const batchSize = 50 // Reduced batch size for price operations
    const currencyCode = "uzs"
    
    for (let i = 0; i < allVariants.length; i += batchSize) {
      const batch = allVariants.slice(i, i + batchSize)
      
      const updatePromises = batch.map(async (variant) => {
        const sku = variant.sku!
        const moySkladPrice = moySkladPrices.get(sku)

        if (moySkladPrice === undefined) {
          notFoundCount++
          return
        }

        try {
          // MoySklad price is in UZS (main units), Medusa stores in smallest units (tiyin)
          const newPriceInTiyin = Math.round(moySkladPrice * 100)

          // Step 1: Get the price set for this variant using remoteLink
          const variantPriceSets = await remoteLink.query({
            entryPoint: "variant_price_set",
            variables: {
              filters: {
                variant_id: variant.id
              }
            },
            fields: ["price_set_id"]
          })

          if (!variantPriceSets.data || variantPriceSets.data.length === 0) {
            // No price set found for this variant - skip
            skippedCount++
            if (skippedCount <= 5) {
              logger.warn(`No price set found for SKU ${sku} (variant ${variant.id})`)
            }
            return
          }

          const priceSetLink = variantPriceSets.data[0] as any
          const priceSetId = priceSetLink.price_set_id

          // Step 2: Get the price set with its money amounts
          const [priceSet] = await pricingModuleService.listPriceSets(
            { id: priceSetId },
            { 
              relations: ["money_amounts"],
              take: 1 
            }
          )

          if (!priceSet) {
            skippedCount++
            return
          }

          // Step 3: Find existing money amount for UZS currency
          const existingMoneyAmount = priceSet.money_amounts?.find(
            (ma: any) => ma.currency_code === currencyCode
          )

          if (existingMoneyAmount) {
            // Check if price changed
            const currentPrice = existingMoneyAmount.amount || 0
            
            if (currentPrice !== newPriceInTiyin) {
              // Update existing price
              await pricingModuleService.updateMoneyAmounts([
                {
                  id: existingMoneyAmount.id,
                  amount: newPriceInTiyin
                }
              ])
              
              updatedCount++
              
              if (updatedCount <= 10) {
                const oldPriceDisplay = (currentPrice / 100).toLocaleString('ru-RU')
                const newPriceDisplay = moySkladPrice.toLocaleString('ru-RU')
                logger.info(`✓ Updated SKU ${sku}: ${oldPriceDisplay} → ${newPriceDisplay} UZS`)
              }
            } else {
              skippedCount++
            }
          } else {
            // Create new money amount for this currency
            await pricingModuleService.addPrices({
              priceSetId: priceSetId,
              prices: [
                {
                  currency_code: currencyCode,
                  amount: newPriceInTiyin
                }
              ]
            })
            
            createdCount++
            
            if (createdCount <= 10) {
              const priceDisplay = moySkladPrice.toLocaleString('ru-RU')
              logger.info(`✓ Created price for SKU ${sku}: ${priceDisplay} UZS`)
            }
          }

        } catch (err) {
          errorCount++
          if (errorCount <= 5) {
            logger.error(`Error processing price for SKU ${sku}:`, err)
          }
        }
      })

      await Promise.all(updatePromises)
      
      // Log progress every 500 items
      const processed = Math.min(i + batchSize, allVariants.length)
      if (processed % 500 === 0 || processed === allVariants.length) {
        logger.info(`Progress: ${processed}/${allVariants.length} variants processed`)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.info(`✅ MoySklad price sync completed in ${duration}s`)
    logger.info(`   📊 Statistics:`)
    logger.info(`      💰 Prices updated: ${updatedCount}`)
    logger.info(`      ➕ Prices created: ${createdCount}`)
    logger.info(`      ⏭️  Unchanged/skipped: ${skippedCount}`)
    logger.info(`      ❓ Not in MoySklad: ${notFoundCount}`)
    logger.info(`      ❌ Errors: ${errorCount}`)
    logger.info(`\n📈 Total: ${moySkladPrices.size} retail prices fetched from MoySklad`)

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    logger.error(`❌ MoySklad price sync failed after ${duration}s`, error)
  }
}

export const config = {
  name: "sync-moysklad-prices",
  // Run every hour
  schedule: "0 * * * *",
}
