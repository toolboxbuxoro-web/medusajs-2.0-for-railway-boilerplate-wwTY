import { ExecArgs } from "@medusajs/framework/types";
import syncMoySkladPricesJob from "../jobs/sync-moysklad-prices";

/**
 * Manual test script for price synchronization
 * 
 * Run with:
 * npx medusa exec ./src/scripts/test-price-sync.ts
 */
export default async function testPriceSync({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  
  logger.info("=".repeat(60));
  logger.info("Starting manual price sync test...");
  logger.info("=".repeat(60));
  
  try {
    await syncMoySkladPricesJob(container);
    logger.info("\n✅ Price sync test completed successfully");
  } catch (error) {
    logger.error("\n❌ Price sync test failed:", error);
    throw error;
  }
  
  logger.info("=".repeat(60));
}
