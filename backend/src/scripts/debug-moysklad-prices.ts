import { ExecArgs } from "@medusajs/framework/types";
import { MOYSKLAD_MODULE } from "../modules/moysklad/constants";
import MoySkladService from "../modules/moysklad/service";

/**
 * Debug script to inspect MoySklad price types
 * 
 * Run with:
 * npx medusa exec ./src/scripts/debug-moysklad-prices.ts
 */
export default async function debugMoySkladPrices({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE);
  
  logger.info("=".repeat(60));
  logger.info("Debugging MoySklad Prices...");
  logger.info("=".repeat(60));
  
  try {
    const baseUrl = "https://api.moysklad.ru/api/remap/1.2";
    const token = process.env.MOYSKLAD_TOKEN;
    
    if (!token) {
      throw new Error("MOYSKLAD_TOKEN is missing");
    }

    // 1. Fetch first 5 products from stock report
    const url = `${baseUrl}/report/stock/bystore?limit=5`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data: any = await response.json();
    
    if (data.rows && data.rows.length > 0) {
      const firstProduct = data.rows[0];
      logger.info(`Inspecting product: ${firstProduct.name} (${firstProduct.code})`);
      logger.info(`Sale Prices: ${JSON.stringify(firstProduct.salePrices, null, 2)}`);
      
      if (firstProduct.salePrices) {
        const typeNames = firstProduct.salePrices.map((p: any) => p.priceType?.name);
        logger.info(`Available price types for this product: ${typeNames.join(", ")}`);
      }
    } else {
      logger.warn("No products found in stock report.");
    }

  } catch (error) {
    logger.error("Debug failed:", error);
  }
  
  logger.info("=".repeat(60));
}
