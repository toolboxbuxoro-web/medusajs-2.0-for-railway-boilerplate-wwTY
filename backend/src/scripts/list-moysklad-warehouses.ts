import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MOYSKLAD_MODULE } from "../modules/moysklad/constants";
import MoySkladService from "../modules/moysklad/service";

export default async function listMoySkladWarehouses({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  
  try {
    const moySkladService: MoySkladService = container.resolve("moysklad");
    
    logger.info("Fetching list of warehouses from MoySklad...");
    const stores = await moySkladService.listStores();
    
    if (stores.length === 0) {
        logger.info("No warehouses found.");
    } else {
        logger.info(`Found ${stores.length} warehouses:`);
        stores.forEach(store => {
            logger.info(`- Name: ${store.name}, ID: ${store.id}`);
        });
    }

  } catch (error: any) {
    logger.error("Error fetching warehouses from MoySklad:", error.message);
    logger.error("Stack:", error.stack);
  }
}
