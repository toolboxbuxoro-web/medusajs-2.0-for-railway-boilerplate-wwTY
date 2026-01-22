import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Admin endpoint to manually complete an order.
 * 
 * POST /admin/orders/:id/complete
 * 
 * This allows admins to manually mark an order as completed,
 * bypassing the automatic subscriber logic if needed.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid order ID" })
      return
    }

    const orderModule: IOrderModuleService = req.scope.resolve(Modules.ORDER)

    // Check if order exists
    let order
    try {
      order = await orderModule.retrieveOrder(id)
    } catch (error: any) {
      if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
        res.status(404).json({ message: "Order not found" })
        return
      }
      throw error
    }

    // Check if already completed
    if (order.status === "completed") {
      res.json({
        message: "Order is already completed",
        order,
      })
      return
    }

    // Update order status to completed
    await orderModule.updateOrders([{
      id,
      status: "completed",
    }])

    // Retrieve updated order
    const updatedOrder = await orderModule.retrieveOrder(id)

    res.json({
      message: "Order completed successfully",
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error(`[POST /admin/orders/${req.params.id}/complete] Error:`, error)
    res.status(500).json({
      message: "Failed to complete order",
      error: error.message || "Internal server error",
    })
  }
}
