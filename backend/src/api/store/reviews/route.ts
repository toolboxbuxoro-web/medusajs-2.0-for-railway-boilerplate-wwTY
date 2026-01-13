import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { IReviewModuleService } from "../../../../modules/reviews/types"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { product_id, rating, text } = req.body as {
    product_id: string
    rating: number
    text?: string
  }

  // Basic validation
  if (!product_id || !rating) {
    return res.status(400).json({ message: "product_id and rating are required" })
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating must be between 1 and 5" })
  }

  const reviewsModuleService: IReviewModuleService = req.scope.resolve("reviews")
  
  // Get customer info from authenticated request
  // Assuming the user is authenticated via JWT and Medusa adds the customer to the request
  const customerId = req.auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Fetch customer details to get name
  const customerModuleService = req.scope.resolve("customer")
  const customer = await customerModuleService.retrieveCustomer(customerId)

  const customerName = customer.first_name || customer.phone || "Anonymous"

  try {
    const review = await reviewsModuleService.createReviews({
      product_id,
      customer_id: customerId,
      customer_name: customerName,
      rating,
      text,
    })

    res.status(201).json({ review })
  } catch (error) {
    if (error.message?.includes("unique constraint")) {
      return res.status(409).json({ message: "You have already reviewed this product" })
    }
    res.status(500).json({ message: error.message })
  }
}
