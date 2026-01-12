"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMoySkladStockWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../modules/moysklad/constants");
const fetchStockFromMoySkladStep = (0, workflows_sdk_1.createStep)("fetch-stock-from-moysklad", async ({ sku }, { container }) => {
    const moySkladService = container.resolve(constants_1.MOYSKLAD_MODULE);
    // Service now uses correct Accept header: application/json;charset=utf-8
    const quantity = await moySkladService.retrieveStockBySku(sku);
    return new workflows_sdk_1.StepResponse(quantity);
});
const updateMedusaInventoryStep = (0, workflows_sdk_1.createStep)("update-medusa-inventory", async ({ sku, quantity }, { container }) => {
    const inventoryService = container.resolve(utils_1.Modules.INVENTORY);
    // List inventory items by SKU
    // listInventoryItems returns Promise<InventoryItemDTO[]>
    const inventoryItems = await inventoryService.listInventoryItems({ sku });
    if (!inventoryItems.length) {
        return new workflows_sdk_1.StepResponse({ updated: false, reason: `Inventory item with SKU ${sku} not found` });
    }
    const inventoryItem = inventoryItems[0];
    // List inventory levels for the item
    // listInventoryLevels returns Promise<InventoryLevelDTO[]>
    const inventoryLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItem.id
    });
    if (!inventoryLevels.length) {
        return new workflows_sdk_1.StepResponse({ updated: false, reason: `No inventory levels found for item ${sku}` });
    }
    // Update the first level found (assuming single stock location for now)
    const level = inventoryLevels[0];
    await inventoryService.updateInventoryLevels([
        {
            inventory_item_id: level.inventory_item_id,
            location_id: level.location_id,
            stocked_quantity: quantity
        }
    ]);
    return new workflows_sdk_1.StepResponse({
        updated: true,
        sku,
        inventoryItemId: inventoryItem.id,
        locationId: level.location_id,
        oldQuantity: level.stocked_quantity,
        newQuantity: quantity
    });
});
exports.syncMoySkladStockWorkflow = (0, workflows_sdk_1.createWorkflow)("sync-moysklad-stock", (input) => {
    const quantity = fetchStockFromMoySkladStep(input);
    const result = updateMedusaInventoryStep({ sku: input.sku, quantity });
    return new workflows_sdk_1.WorkflowResponse(result);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3luYy1tb3lza2xhZC1zdG9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy93b3JrZmxvd3Mvc3luYy1tb3lza2xhZC1zdG9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxRUFBOEc7QUFDOUcscURBQW1EO0FBQ25ELDZEQUErRDtBQWlCL0QsTUFBTSwwQkFBMEIsR0FBRyxJQUFBLDBCQUFVLEVBQzNDLDJCQUEyQixFQUMzQixLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQWlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQzlDLE1BQU0sZUFBZSxHQUFvQixTQUFTLENBQUMsT0FBTyxDQUFDLDJCQUFlLENBQUMsQ0FBQTtJQUMzRSx5RUFBeUU7SUFDekUsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDOUQsT0FBTyxJQUFJLDRCQUFZLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDbkMsQ0FBQyxDQUNGLENBQUE7QUFFRCxNQUFNLHlCQUF5QixHQUFHLElBQUEsMEJBQVUsRUFDMUMseUJBQXlCLEVBQ3pCLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQXFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBcUMsRUFBRTtJQUMvRyxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBRTdELDhCQUE4QjtJQUM5Qix5REFBeUQ7SUFDekQsTUFBTSxjQUFjLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUE7SUFFekUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixPQUFPLElBQUksNEJBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLDJCQUEyQixHQUFHLFlBQVksRUFBRSxDQUFDLENBQUE7SUFDakcsQ0FBQztJQUVELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV2QyxxQ0FBcUM7SUFDckMsMkRBQTJEO0lBQzNELE1BQU0sZUFBZSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7UUFDakUsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLEVBQUU7S0FDcEMsQ0FBQyxDQUFBO0lBRUYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixPQUFPLElBQUksNEJBQVksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLHNDQUFzQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDbkcsQ0FBQztJQUVELHdFQUF3RTtJQUN4RSxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFaEMsTUFBTSxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQztRQUMzQztZQUNFLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxpQkFBaUI7WUFDMUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxXQUFXO1lBQzlCLGdCQUFnQixFQUFFLFFBQVE7U0FDM0I7S0FDRixDQUFDLENBQUE7SUFFRixPQUFPLElBQUksNEJBQVksQ0FBQztRQUN0QixPQUFPLEVBQUUsSUFBSTtRQUNiLEdBQUc7UUFDSCxlQUFlLEVBQUUsYUFBYSxDQUFDLEVBQUU7UUFDakMsVUFBVSxFQUFFLEtBQUssQ0FBQyxXQUFXO1FBQzdCLFdBQVcsRUFBRSxLQUFLLENBQUMsZ0JBQWdCO1FBQ25DLFdBQVcsRUFBRSxRQUFRO0tBQ3RCLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FDRixDQUFBO0FBRVksUUFBQSx5QkFBeUIsR0FBRyxJQUFBLDhCQUFjLEVBQ3JELHFCQUFxQixFQUNyQixDQUFDLEtBQW9CLEVBQUUsRUFBRTtJQUN2QixNQUFNLFFBQVEsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNsRCxNQUFNLE1BQU0sR0FBRyx5QkFBeUIsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDdEUsT0FBTyxJQUFJLGdDQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ3JDLENBQUMsQ0FDRixDQUFBIn0=