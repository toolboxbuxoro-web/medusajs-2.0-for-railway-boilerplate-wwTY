"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = syncMoySkladStockJob;
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../modules/moysklad/constants");
/**
 * MoySklad Stock Sync Job
 *
 * Runs every 15 minutes to sync all product stock from MoySklad to Medusa.
 * Uses bulk API to efficiently fetch all products in batches of 1000.
 */
async function syncMoySkladStockJob(container) {
    const logger = container.resolve("logger");
    const productModuleService = container.resolve(utils_1.Modules.PRODUCT);
    const inventoryService = container.resolve(utils_1.Modules.INVENTORY);
    const moySkladService = container.resolve(constants_1.MOYSKLAD_MODULE);
    const startTime = Date.now();
    logger.info("🔄 Starting MoySklad stock sync job...");
    try {
        // Step 1: Fetch ALL stock from MoySklad in bulk (efficient - ~6 API calls for 5712 products)
        logger.info("Fetching stock from MoySklad API...");
        const moySkladStock = await moySkladService.retrieveAllStock();
        logger.info(`Received ${moySkladStock.size} products from MoySklad`);
        // Step 2: Fetch ALL Medusa variants with pagination
        const allVariants = [];
        const pageSize = 500;
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
            const [variants, count] = await productModuleService.listAndCountProductVariants({}, {
                take: pageSize,
                skip: offset,
                select: ["id", "sku"]
            });
            allVariants.push(...variants.filter(v => v.sku));
            offset += pageSize;
            hasMore = variants.length === pageSize;
            if (allVariants.length % 1000 === 0 || !hasMore) {
                logger.info(`Loaded ${allVariants.length} Medusa variants...`);
            }
        }
        logger.info(`Total Medusa variants with SKU: ${allVariants.length}`);
        // Step 3: Match and update inventory
        let updatedCount = 0;
        let skippedCount = 0;
        let notFoundCount = 0;
        let errorCount = 0;
        // Process in batches for memory efficiency
        const batchSize = 100;
        for (let i = 0; i < allVariants.length; i += batchSize) {
            const batch = allVariants.slice(i, i + batchSize);
            const updatePromises = batch.map(async (variant) => {
                const sku = variant.sku;
                const moySkladQuantity = moySkladStock.get(sku);
                if (moySkladQuantity === undefined) {
                    notFoundCount++;
                    return;
                }
                try {
                    // Get inventory item by SKU
                    const inventoryItems = await inventoryService.listInventoryItems({ sku });
                    if (!inventoryItems.length) {
                        skippedCount++;
                        return;
                    }
                    const inventoryItem = inventoryItems[0];
                    // Get inventory levels
                    const inventoryLevels = await inventoryService.listInventoryLevels({
                        inventory_item_id: inventoryItem.id
                    });
                    if (!inventoryLevels.length) {
                        skippedCount++;
                        return;
                    }
                    const level = inventoryLevels[0];
                    const currentQuantity = level.stocked_quantity || 0;
                    // Only update if quantity changed
                    if (currentQuantity !== moySkladQuantity) {
                        await inventoryService.updateInventoryLevels([
                            {
                                inventory_item_id: level.inventory_item_id,
                                location_id: level.location_id,
                                stocked_quantity: moySkladQuantity
                            }
                        ]);
                        updatedCount++;
                        if (updatedCount <= 10) {
                            logger.info(`Updated SKU ${sku}: ${currentQuantity} → ${moySkladQuantity}`);
                        }
                    }
                    else {
                        skippedCount++;
                    }
                }
                catch (err) {
                    errorCount++;
                    logger.error(`Error updating SKU ${sku}:`, err);
                }
            });
            await Promise.all(updatePromises);
            // Log progress every 500 items
            const processed = Math.min(i + batchSize, allVariants.length);
            if (processed % 500 === 0 || processed === allVariants.length) {
                logger.info(`Progress: ${processed}/${allVariants.length} variants processed`);
            }
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.info(`✅ MoySklad sync completed in ${duration}s`);
        logger.info(`   📊 Updated: ${updatedCount}`);
        logger.info(`   ⏭️  Unchanged: ${skippedCount}`);
        logger.info(`   ❓ Not in MoySklad: ${notFoundCount}`);
        logger.info(`   ❌ Errors: ${errorCount}`);
    }
    catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error(`❌ MoySklad sync failed after ${duration}s`, error);
    }
}
exports.config = {
    name: "sync-moysklad-stock",
    // Run every 15 minutes
    schedule: "*/15 * * * *",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1tb3lza2xhZC1zdG9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9qb2JzL3N5bmMtbW95c2tsYWQtc3RvY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBV0EsdUNBa0lDO0FBNUlELHFEQUFtRDtBQUNuRCw2REFBK0Q7QUFHL0Q7Ozs7O0dBS0c7QUFDWSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsU0FBMEI7SUFDM0UsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQy9ELE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDN0QsTUFBTSxlQUFlLEdBQW9CLFNBQVMsQ0FBQyxPQUFPLENBQUMsMkJBQWUsQ0FBQyxDQUFBO0lBRTNFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxDQUFDLENBQUE7SUFFckQsSUFBSSxDQUFDO1FBQ0gsNkZBQTZGO1FBQzdGLE1BQU0sQ0FBQyxJQUFJLENBQUMscUNBQXFDLENBQUMsQ0FBQTtRQUNsRCxNQUFNLGFBQWEsR0FBRyxNQUFNLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1FBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxhQUFhLENBQUMsSUFBSSx5QkFBeUIsQ0FBQyxDQUFBO1FBRXBFLG9EQUFvRDtRQUNwRCxNQUFNLFdBQVcsR0FBeUMsRUFBRSxDQUFBO1FBQzVELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQTtRQUNwQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUE7UUFDZCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUE7UUFFbEIs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