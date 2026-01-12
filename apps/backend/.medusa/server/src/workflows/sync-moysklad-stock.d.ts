type WorkflowInput = {
    sku: string;
};
type StepOutput = {
    updated: boolean;
    reason?: string;
    sku?: string;
    inventoryItemId?: string;
    locationId?: string;
    oldQuantity?: number;
    newQuantity?: number;
};
export declare const syncMoySkladStockWorkflow: import("@medusajs/framework/workflows-sdk").ReturnWorkflow<WorkflowInput, StepOutput, []>;
export {};
