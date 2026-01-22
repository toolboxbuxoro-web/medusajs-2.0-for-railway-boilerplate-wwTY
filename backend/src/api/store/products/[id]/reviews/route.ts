import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import ReviewsService from "../../../../../modules/reviews/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const { limit = 10, offset = 0, sort: rawSort = "newest" } = req.query as any

    // Normalize and clamp pagination parameters to avoid pathological
    // values that could lead to excessive load.
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

    // Clean sort parameter (handle cache-busting suffix like "newest:1" → "newest")
    const sort = typeof rawSort === "string" ? rawSort.split(":")[0] : "newest"

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const order = sort === "rating_desc" ? { rating: "DESC" } : { created_at: "DESC" }

    // Only return approved reviews
    const [reviews, count] = await reviewsModuleService.listAndCountReviews(
      { product_id: id, status: "approved" },
      {
        take: safeLimit,
        skip: safeOffset,
        order,
      }
    )

    // Prefer aggregated rating metadata maintained by the review aggregation
    // subscriber. This avoids scanning all reviews on each product page load.
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    let product
    try {
      product = await productService.retrieveProduct(id)
    } catch (error: any) {
      // Product not found or other error
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
      // Fallback path for legacy products where metadata wasn't yet populated.
      // This performs a one-off scan but keeps behavior backwards compatible.
      const allApproved = await reviewsModuleService.listReviews(
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

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: product_id } = req.params
  const { rating, comment, pros, cons, images } = req.body as any
  
  const customerId = (req as any).auth_context?.actor_id
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Customer: ${customerId || "unauthorized"}, Product: ${product_id}`)
  
  if (!customerId) {
    console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Unauthorized access attempt`)
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (!product_id) {
    console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Missing product_id`)
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
    console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid rating: ${rating}`)
    return res.status(400).json({
      error: "Rating must be an integer between 1 and 5",
    })
  }

  // Validate and sanitize comment (max 2000 chars)
  let sanitizedComment: string | null = null
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid comment type: ${typeof comment}`)
      return res.status(400).json({ error: "Comment must be a string" })
    }
    const trimmed = comment.trim()
    if (trimmed.length > 2000) {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Comment too long: ${trimmed.length} chars`)
      return res.status(400).json({ error: "Comment must be 2000 characters or less" })
    }
    sanitizedComment = trimmed.length > 0 ? trimmed : null
  }

  // Validate and sanitize pros (max 500 chars)
  let sanitizedPros: string | null = null
  if (pros !== undefined && pros !== null) {
    if (typeof pros !== "string") {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid pros type: ${typeof pros}`)
      return res.status(400).json({ error: "Pros must be a string" })
    }
    const trimmed = pros.trim()
    if (trimmed.length > 500) {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Pros too long: ${trimmed.length} chars`)
      return res.status(400).json({ error: "Pros must be 500 characters or less" })
    }
    sanitizedPros = trimmed.length > 0 ? trimmed : null
  }

  // Validate and sanitize cons (max 500 chars)
  let sanitizedCons: string | null = null
  if (cons !== undefined && cons !== null) {
    if (typeof cons !== "string") {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid cons type: ${typeof cons}`)
      return res.status(400).json({ error: "Cons must be a string" })
    }
    const trimmed = cons.trim()
    if (trimmed.length > 500) {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Cons too long: ${trimmed.length} chars`)
      return res.status(400).json({ error: "Cons must be 500 characters or less" })
    }
    sanitizedCons = trimmed.length > 0 ? trimmed : null
  }

  // Validate images (max 5 URLs)
  let sanitizedImages: string[] = []
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images)) {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Images is not an array: ${typeof images}`)
      return res.status(400).json({ error: "Images must be an array" })
    }
    if (images.length > 5) {
      console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Too many images: ${images.length}`)
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

    console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Validating ${images.length} image URL(s)`)

    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("http")) {
        console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid image URL format: ${img}`)
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
          console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Image URL from disallowed domain: ${hostname}`)
          return res.status(400).json({ 
            error: `Image URL must be from an allowed domain. Hostname: ${hostname}` 
          })
        }
      } catch (e) {
        console.warn(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Invalid image URL: ${img}`, e)
        return res.status(400).json({ error: "Invalid image URL format" })
      }
    }
    sanitizedImages = images
    console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Validated ${sanitizedImages.length} image URL(s)`)
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

  try {
    // Use the service method for validation
    console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Checking review eligibility...`)
    const eligibility = await reviewsModuleService.canReview(product_id, customerId)

    if (!eligibility.can_review) {
      console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Review not allowed: ${eligibility.reason}`)
      const status =
        eligibility.reason === "already_reviewed"
          ? 400
          : 403

      let errorMessage = "You can only review products from completed orders"

      if (eligibility.reason === "already_reviewed") {
        errorMessage = "You have already reviewed this product"
      } else if (eligibility.reason === "no_completed_order") {
        errorMessage = "You can only review delivered products"
      }

      return res.status(status).json({
        error: errorMessage,
        can_review: false,
        reason: eligibility.reason,
      })
    }

    // Ensure order_id is present (should always be if can_review is true)
    if (!eligibility.order_id) {
      console.error(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Eligibility check passed but order_id is missing!`, eligibility)
      return res.status(500).json({
        error: "Internal server error: order_id not found",
      })
    }

    console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Creating review with order_id: ${eligibility.order_id}`)

    // Create review with all marketplace fields and emit event for aggregation
    const review = await reviewsModuleService.createReviewWithEvent({
      product_id,
      customer_id: customerId,
      order_id: eligibility.order_id,
      rating: numericRating,
      comment: sanitizedComment,
      pros: sanitizedPros,
      cons: sanitizedCons,
      images: (sanitizedImages.length > 0 ? sanitizedImages : null) as any,
      status: "pending"
    })

    const reviewId = Array.isArray(review) ? review[0]?.id : (review as any)?.id
    console.log(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Review created successfully: ${reviewId}`)

    res.status(201).json({ review })
  } catch (error: any) {
    // Log error for debugging but don't expose internal details
    console.error(`[POST /store/products/${product_id}/reviews] Request ${requestId} - Error:`, {
      error: error.message,
      stack: error.stack,
      productId: product_id,
      customerId,
      rating: numericRating,
      hasImages: sanitizedImages.length > 0
    })
    
    return res.status(500).json({
      error: "Failed to create review. Please try again later.",
    })
  }
}

