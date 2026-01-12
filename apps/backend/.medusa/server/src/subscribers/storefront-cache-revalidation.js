"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = storefrontCacheHandler;
/**
 * Storefront Cache Revalidation Subscriber
 *
 * Automatically invalidates storefront cache when products or collections
 * are created, updated, or deleted in Medusa admin.
 *
 * This enables long cache times (1 hour) while ensuring fresh data
 * appears immediately after admin updates.
 */
const STOREFRONT_URL = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || "";
async function revalidateStorefront(tags) {
    const url = `${STOREFRONT_URL}/api/revalidate`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-revalidate-secret": REVALIDATION_SECRET,
            },
            body: JSON.stringify({ tags }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`[Cache Revalidation] Success: ${tags.join(", ")}`, data);
        }
        else {
            console.error(`[Cache Revalidation] Failed: ${response.status} ${response.statusText}`);
        }
    }
    catch (error) {
        // Don't throw - we don't want to break admin operations if storefront is down
        console.error("[Cache Revalidation] Error:", error instanceof Error ? error.message : error);
    }
}
// Product events handler
async function storefrontCacheHandler({ event, }) {
    const eventName = event.name || "";
    console.log(`[Cache Revalidation] Event received: ${eventName}`);
    // Determine which tags to revalidate based on event
    const tags = [];
    if (eventName.includes("product")) {
        tags.push("products");
    }
    if (eventName.includes("collection")) {
        tags.push("collections");
    }
    if (eventName.includes("category")) {
        tags.push("categories");
    }
    if (tags.length > 0) {
        // Small delay to ensure database transaction is committed
        setTimeout(() => {
            revalidateStorefront(tags);
        }, 500);
    }
}
exports.config = {
    event: [
        // Product events
        "product.created",
        "product.updated",
        "product.deleted",
        // Collection events  
        "product-collection.created",
        "product-collection.updated",
        "product-collection.deleted",
        // Category events
        "product-category.created",
        "product-category.updated",
        "product-category.deleted",
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVmcm9udC1jYWNoZS1yZXZhbGlkYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvc3RvcmVmcm9udC1jYWNoZS1yZXZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBeUNBLHlDQTRCQztBQW5FRDs7Ozs7Ozs7R0FRRztBQUVILE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLElBQUksdUJBQXVCLENBQUE7QUFDaEgsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLEVBQUUsQ0FBQTtBQUVqRSxLQUFLLFVBQVUsb0JBQW9CLENBQUMsSUFBYztJQUNoRCxNQUFNLEdBQUcsR0FBRyxHQUFHLGNBQWMsaUJBQWlCLENBQUE7SUFFOUMsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7Z0JBQ2xDLHFCQUFxQixFQUFFLG1CQUFtQjthQUMzQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDL0IsQ0FBQyxDQUFBO1FBRUYsSUFBSSxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3ZFLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQTtRQUN6RixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZiw4RUFBOEU7UUFDOUUsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM5RixDQUFDO0FBQ0gsQ0FBQztBQUVELHlCQUF5QjtBQUNWLEtBQUssVUFBVSxzQkFBc0IsQ0FBQyxFQUNuRCxLQUFLLEdBQ21DO0lBQ3hDLE1BQU0sU0FBUyxHQUFJLEtBQWEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFBO0lBRTNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLFNBQVMsRUFBRSxDQUFDLENBQUE7SUFFaEUsb0RBQW9EO0lBQ3BELE1BQU0sSUFBSSxHQUFhLEVBQUUsQ0FBQTtJQUV6QixJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFFRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDcEIsMERBQTBEO1FBQzFELFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDVCxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsTUFBTSxHQUFxQjtJQUN0QyxLQUFLLEVBQUU7UUFDTCxpQkFBaUI7UUFDakIsaUJBQWlCO1FBQ2pCLGlCQUFpQjtRQUNqQixpQkFBaUI7UUFDakIsc0JBQXNCO1FBQ3RCLDRCQUE0QjtRQUM1Qiw0QkFBNEI7UUFDNUIsNEJBQTRCO1FBQzVCLGtCQUFrQjtRQUNsQiwwQkFBMEI7UUFDMUIsMEJBQTBCO1FBQzFCLDBCQUEwQjtLQUMzQjtDQUNGLENBQUEifQ==