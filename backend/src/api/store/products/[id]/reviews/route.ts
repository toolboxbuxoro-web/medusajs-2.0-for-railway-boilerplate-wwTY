import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import ReviewsService from "../../../../../modules/reviews/service"

/**
 * GET /store/products/:id/reviews
 * Get approved reviews for a product with pagination and sorting
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const { limit = 10, offset = 0, sort: rawSort = "newest" } = req.query as any

    // Normalize and clamp pagination parameters
    const rawLimit = Number.parseInt(String(limit), 10)
    const rawOffset = Number.parseInt(String(offset), 10)

    const safeLimit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 50)
        : 10

    const safeOffset =
      Number.isFinite(rawOffset) && rawOffset >= 0
        ? rawOffset
        : 0

    // Clean sort parameter
    const sort = typeof rawSort === "string" ? rawSort.split(":")[0] : "newest"

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const order = sort === "rating_desc" ? { rating: "DESC" } : { created_at: "DESC" }

    // Only return approved reviews
    const [reviews, count] = await reviewsModuleService.listAndCountReviewsWithConversion(
      { product_id: id, status: "approved" },
      {
        take: safeLimit,
        skip: safeOffset,
        order,
      }
    )

    // Get product metadata for aggregated rating
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    let product
    try {
      product = await productService.retrieveProduct(id)
    } catch (error: any) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    const metadata = (product?.metadata || {}) as any

    let average_rating: number
    let distribution: Record<number, number>

    if (typeof metadata.rating_avg === "number") {
      average_rating = metadata.rating_avg
      distribution = (metadata.rating_distribution || {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }) as Record<number, number>
    } else {
      // Fallback: calculate from reviews
      const allApproved = await reviewsModuleService.listReviewsWithConversion(
        { product_id: id, status: "approved" },
        { select: ["rating"] }
      )

      const totalRating = allApproved.reduce((acc, curr) => acc + curr.rating, 0)
      average_rating =
        allApproved.length > 0
          ? parseFloat((totalRating / allApproved.length).toFixed(1))
          : 0

      distribution = {
        1: allApproved.filter((r) => r.rating === 1).length,
        2: allApproved.filter((r) => r.rating === 2).length,
        3: allApproved.filter((r) => r.rating === 3).length,
        4: allApproved.filter((r) => r.rating === 4).length,
        5: allApproved.filter((r) => r.rating === 5).length,
      }
    }

    res.status(200).json({
      reviews,
      average_rating,
      distribution,
      total: count,
    })
  } catch (error: any) {
    console.error(`[GET /store/products/${req.params.id}/reviews] Error:`, error)
    return res.status(500).json({ error: "Failed to fetch reviews" })
  }
}

/**
 * POST /store/products/:id/reviews
 * Create a new review for a product
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: product_id } = req.params
  const { rating, title, comment, pros, cons, images } = req.body as any
  
  const customerId = (req as any).auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (!product_id) {
    return res.status(400).json({ error: "Product id is required" })
  }

  // Validate rating
  const numericRating = Number(rating)

  if (
    Number.isNaN(numericRating) ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(400).json({
      error: "Rating must be an integer between 1 and 5",
    })
  }

  // Validate and sanitize comment (max 2000 chars)
  let sanitizedComment: string | null = null
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      return res.status(400).json({ error: "Comment must be a string" })
    }
    const trimmed = comment.trim()
    if (trimmed.length > 2000) {
      return res.status(400).json({ error: "Comment must be 2000 characters or less" })
    }
    sanitizedComment = trimmed.length > 0 ? trimmed : null
  }

  // Validate and sanitize title (max 200 chars)
  let sanitizedTitle: string | null = null
  if (title !== undefined && title !== null) {
    if (typeof title !== "string") {
      return res.status(400).json({ error: "Title must be a string" })
    }
    const trimmed = title.trim()
    if (trimmed.length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or less" })
    }
    sanitizedTitle = trimmed.length > 0 ? trimmed : null
  }

  // Validate and sanitize pros (max 500 chars)
  let sanitizedPros: string | null = null
  if (pros !== undefined && pros !== null) {
    if (typeof pros !== "string") {
      return res.status(400).json({ error: "Pros must be a string" })
    }
    const trimmed = pros.trim()
    if (trimmed.length > 500) {
      return res.status(400).json({ error: "Pros must be 500 characters or less" })
    }
    sanitizedPros = trimmed.length > 0 ? trimmed : null
  }

  // Validate and sanitize cons (max 500 chars)
  let sanitizedCons: string | null = null
  if (cons !== undefined && cons !== null) {
    if (typeof cons !== "string") {
      return res.status(400).json({ error: "Cons must be a string" })
    }
    const trimmed = cons.trim()
    if (trimmed.length > 500) {
      return res.status(400).json({ error: "Cons must be 500 characters or less" })
    }
    sanitizedCons = trimmed.length > 0 ? trimmed : null
  }

  // Validate images (max 5 URLs)
  let sanitizedImages: string[] = []
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images)) {
      return res.status(400).json({ error: "Images must be an array" })
    }
    if (images.length > 5) {
      return res.status(400).json({ error: "Maximum 5 images allowed" })
    }
    
    // Validate each image URL
    const allowedDomains = [
      process.env.MINIO_ENDPOINT,
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/^https?:\/\//, "").split("/")[0],
      "localhost:9000",
      "medusa-public-images.s3.eu-west-1.amazonaws.com",
      "medusa-server-testing.s3.amazonaws.com",
    ].filter(Boolean) as string[]

    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("http")) {
        return res.status(400).json({ error: "Each image must be a valid URL" })
      }
      
      // Security: Validate that URLs point to allowed domains
      try {
        const url = new URL(img)
        const hostname = url.hostname
        const isAllowed = allowedDomains.some(domain => 
          hostname === domain || hostname.endsWith(`.${domain}`)
        )
        
        if (!isAllowed) {
          return res.status(400).json({ 
            error: `Image URL must be from an allowed domain. Hostname: ${hostname}` 
          })
        }
      } catch (e) {
        return res.status(400).json({ error: "Invalid image URL format" })
      }
    }
    sanitizedImages = images
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

  try {
    // Check review eligibility
    const pgConnection = req.scope.resolve("__pg_connection__")
    const eligibility = await reviewsModuleService.canReview(product_id, customerId, pgConnection)

    if (!eligibility.can_review) {
      const status =
        eligibility.reason === "already_reviewed"
          ? 400
          : 403

      let errorMessage = "You can only review products from completed orders"

      if (eligibility.reason === "already_reviewed") {
        errorMessage = "You have already reviewed this product"
      } else if (eligibility.reason === "no_completed_order") {
        errorMessage = "You can only review products you have received"
      }

      return res.status(status).json({
        error: errorMessage,
        can_review: false,
        reason: eligibility.reason,
      })
    }

    // Ensure order_id is present
    if (!eligibility.order_id) {
      return res.status(500).json({
        error: "Internal server error: order_id not found",
      })
    }

    // Create review
    const review = await reviewsModuleService.createReviewWithValidation({
      product_id,
      customer_id: customerId,
      order_id: eligibility.order_id,
      rating: numericRating,
      title: sanitizedTitle,
      comment: sanitizedComment,
      pros: sanitizedPros,
      cons: sanitizedCons,
      images: sanitizedImages.length > 0 ? sanitizedImages : null,
      status: "pending",
    })

    res.status(201).json({ review })
  } catch (error: any) {
    console.error(`[POST /store/products/${product_id}/reviews] Error:`, {
      error: error.message,
      stack: error.stack,
      productId: product_id,
      customerId,
    })
    
    return res.status(500).json({
      error: "Failed to create review. Please try again later.",
    })
  }
}
