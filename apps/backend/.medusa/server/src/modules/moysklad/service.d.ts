import { Logger } from "@medusajs/framework/types";
type InjectedDependencies = {
    logger: Logger;
};
export default class MoySkladService {
    protected logger_: Logger;
    protected token_: string;
    protected baseUrl_: string;
    constructor({ logger }: InjectedDependencies);
    /**
     * Get default headers for MoySklad API requests
     */
    private getHeaders;
    /**
     * Retrieve stock for a single SKU (code)
     */
    retrieveStockBySku(sku: string): Promise<number>;
    /**
     * Retrieve all products with stock in bulk (with pagination)
     * Returns a Map of code => quantity for efficient lookup
     */
    retrieveAllStock(): Promise<Map<string, number>>;
    /**
     * Get total count of products in MoySklad
     */
    getProductCount(): Promise<number>;
}
export {};
