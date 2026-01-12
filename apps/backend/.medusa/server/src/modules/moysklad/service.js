"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MoySkladService {
    logger_;
    token_;
    baseUrl_ = "https://api.moysklad.ru/api/remap/1.2";
    constructor({ logger }) {
        this.logger_ = logger;
        this.token_ = process.env.MOYSKLAD_TOKEN || "";
        if (!this.token_) {
            this.logger_.warn("MOYSKLAD_TOKEN is not set in environment variables. MoySklad integration will not work.");
        }
    }
    /**
     * Get default headers for MoySklad API requests
     */
    getHeaders() {
        return {
            "Authorization": `Bearer ${this.token_}`,
            "Accept": "application/json;charset=utf-8",
            "Content-Type": "application/json"
        };
    }
    /**
     * Retrieve stock for a single SKU (code)
     */
    async retrieveStockBySku(sku) {
        if (!this.token_) {
            throw new Error("MOYSKLAD_TOKEN is not configured");
        }
        const url = `${this.baseUrl_}/entity/assortment?filter=code=${encodeURIComponent(sku)}`;
        try {
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            if (!response.ok) {
                throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data.rows && data.rows.length > 0) {
                const product = data.rows[0];
                return product.quantity || 0;
            }
            this.logger_.warn(`Product with SKU ${sku} not found in MoySklad`);
            return 0;
        }
        catch (error) {
            this.logger_.error(`Failed to retrieve stock for SKU ${sku} from MoySklad`, error);
            throw error;
        }
    }
    /**
     * Retrieve all products with stock in bulk (with pagination)
     * Returns a Map of code => quantity for efficient lookup
     */
    async retrieveAllStock() {
        if (!this.token_) {
            throw new Error("MOYSKLAD_TOKEN is not configured");
        }
        const stockMap = new Map();
        const batchSize = 1000;
        let offset = 0;
        let totalFetched = 0;
        let totalProducts = 0;
        this.logger_.info("Starting bulk stock retrieval from MoySklad...");
        try {
            do {
                const url = `${this.baseUrl_}/entity/assortment?limit=${batchSize}&offset=${offset}`;
                const response = await fetch(url, {
                    headers: this.getHeaders()
                });
                if (!response.ok) {
                    throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                totalProducts = data.meta.size;
                for (const product of data.rows) {
                    if (product.code) {
                        stockMap.set(product.code, product.quantity || 0);
                    }
                }
                totalFetched += data.rows.length;
                offset += batchSize;
                this.logger_.info(`Fetched ${totalFetched}/${totalProducts} products from MoySklad...`);
                // Small delay to avoid rate limiting
                if (offset < totalProducts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } while (offset < totalProducts);
            this.logger_.info(`Successfully retrieved stock for ${stockMap.size} products from MoySklad`);
            return stockMap;
        }
        catch (error) {
            this.logger_.error("Failed to retrieve bulk stock from MoySklad", error);
            throw error;
        }
    }
    /**
     * Get total count of products in MoySklad
     */
    async getProductCount() {
        if (!this.token_) {
            throw new Error("MOYSKLAD_TOKEN is not configured");
        }
        const url = `${this.baseUrl_}/entity/assortment?limit=1`;
        try {
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            if (!response.ok) {
                throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.meta.size;
        }
        catch (error) {
            this.logger_.error("Failed to get product count from MoySklad", error);
            throw error;
        }
    }
}
exports.default = MoySkladService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL21veXNrbGFkL3NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsTUFBcUIsZUFBZTtJQUN4QixPQUFPLENBQVE7SUFDZixNQUFNLENBQVE7SUFDZCxRQUFRLEdBQUcsdUNBQXVDLENBQUE7SUFFNUQsWUFBWSxFQUFFLE1BQU0sRUFBd0I7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUE7UUFFOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyx5RkFBeUYsQ0FBQyxDQUFBO1FBQzlHLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxVQUFVO1FBQ2hCLE9BQU87WUFDTCxlQUFlLEVBQUUsVUFBVSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3hDLFFBQVEsRUFBRSxnQ0FBZ0M7WUFDMUMsY0FBYyxFQUFFLGtCQUFrQjtTQUNuQyxDQUFBO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQVc7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUE7UUFDckQsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsa0NBQWtDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUE7UUFFdkYsSUFBSSxDQUFDO1lBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNoQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVB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