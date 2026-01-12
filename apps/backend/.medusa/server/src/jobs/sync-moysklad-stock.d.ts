import { MedusaContainer } from "@medusajs/framework/types";
/**
 * MoySklad Stock Sync Job
 *
 * Runs every 15 minutes to sync all product stock from MoySklad to Medusa.
 * Uses bulk API to efficiently fetch all products in batches of 1000.
 */
export default function syncMoySkladStockJob(container: MedusaContainer): Promise<void>;
export declare const config: {
    name: string;
    schedule: string;
};
