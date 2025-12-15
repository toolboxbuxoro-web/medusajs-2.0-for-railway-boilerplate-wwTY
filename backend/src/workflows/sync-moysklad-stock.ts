import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "../modules/moysklad"
import MoySkladService from "../modules/moysklad/service"

type WorkflowInput = {
  sku: string
}

type StepOutput = {
  updated: boolean
  reason?: string
  sku?: string
  inventoryItemId?: string
  locationId?: string
  oldQuantity?: number
  newQuantity?: number
}

const fetchStockFromMoySkladStep = createStep(
  "fetch-stock-from-moysklad",
  async ({ sku }: WorkflowInput, { container }) => {
    const moySkladService: MoySkladService = container.resolve(MOYSKLAD_MODULE)
    // Service now uses correct Accept header: application/json;charset=utf-8
    const quantity = await moySkladService.retrieveStockBySku(sku)
    return new StepResponse(quantity)
  }
)

const updateMedusaInventoryStep = createStep(
  "update-medusa-inventory",
  async ({ sku, quantity }: { sku: string; quantity: number }, { container }): Promise<StepResponse<StepOutput>> => {
    const inventoryService = container.resolve(Modules.INVENTORY)
    
    // List inventory items by SKU
    // listInventoryItems returns Promise<InventoryItemDTO[]>
    const inventoryItems = await inventoryService.listInventoryItems({ sku })
    
    if (!inventoryItems.length) {
      return new StepResponse({ updated: false, reason: `Inventory item with SKU ${sku} not found` })
    }
    
    const inventoryItem = inventoryItems[0]
    
    // List inventory levels for the item
    // listInventoryLevels returns Promise<InventoryLevelDTO[]>
    const inventoryLevels = await inventoryService.listInventoryLevels({ 
      inventory_item_id: inventoryItem.id 
    })
    
    if (!inventoryLevels.length) {
       return new StepResponse({ updated: false, reason: `No inventory levels found for item ${sku}` })
    }
    
    // Update the first level found (assuming single stock location for now)
    const level = inventoryLevels[0]
    
    await inventoryService.updateInventoryLevels([
      {
        inventory_item_id: level.inventory_item_id,
        location_id: level.location_id,
        stocked_quantity: quantity
      }
    ])
    
    return new StepResponse({ 
      updated: true, 
      sku, 
      inventoryItemId: inventoryItem.id,
      locationId: level.location_id,
      oldQuantity: level.stocked_quantity, 
      newQuantity: quantity 
    })
  }
)

export const syncMoySkladStockWorkflow = createWorkflow(
  "sync-moysklad-stock",
  (input: WorkflowInput) => {
    const quantity = fetchStockFromMoySkladStep(input)
    const result = updateMedusaInventoryStep({ sku: input.sku, quantity })
    return new WorkflowResponse(result)
  }
)
