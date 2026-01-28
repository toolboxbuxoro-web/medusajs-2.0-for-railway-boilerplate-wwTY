import { ExecArgs } from "@medusajs/framework/types";
import { MOYSKLAD_MODULE } from "../modules/moysklad/constants";
import MoySkladService from "../modules/moysklad/service";

/**
 * Script to list MoySklad price types
 * 
 * Run with:
 * npx medusa exec ./src/scripts/list-moysklad-price-types.ts
 */
export default async function listMoySkladPriceTypes({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE);
  
  logger.info("=".repeat(60));
  logger.info("Listing MoySklad Price Types...");
  logger.info("=".repeat(60));
  
  try {
    const priceTypes = await moySkladService.retrievePriceTypes();
    
    if (!priceTypes || priceTypes.length === 0) {
      logger.warn("No price types found in MoySklad.");
    } else {
      logger.info(`Found ${priceTypes.length} price types:`);
      priceTypes.forEach(pt => {
        logger.info(`- Name: "${pt.name}", ID: ${pt.id}`);
      });
    }

  } catch (error) {
    logger.error("Failed to list price types:", error);
  }
  
  logger.info("=".repeat(60));
}
