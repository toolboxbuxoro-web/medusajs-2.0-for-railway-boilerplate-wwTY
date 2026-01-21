import {
  ExecArgs,
  IOrderModuleService,
  ICustomerModuleService,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import ReviewsService from "../modules/reviews/service"

export default async function reviewsE2EFlow({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const orderModuleService =
    container.resolve<IOrderModuleService>(Modules.ORDER)
  const customerModule =
    container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
  const reviewsModuleService =
    container.resolve<ReviewsService>("reviews")

  logger.info(
    "[reviews-e2e-flow] Starting full post-purchase reviews scenario"
  )

  try {
    //
    // 1) Pick any existing product with at least one variant & price
    //
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.prices.currency_code",
        "variants.prices.amount",
      ],
      pagination: {
        take: 1,
      },
    })

    const product: any = products?.[0]

    if (!product) {
      throw new Error(
        "[reviews-e2e-flow] No products found in database – cannot run scenario"
      )
    }

    const variant = product.variants?.[0]
    if (!variant) {
      throw new Error(
        `[reviews-e2e-flow] Product ${product.id} has no variants`
      )
    }

    const price = variant.prices?.[0]
    const currencyCode = price?.currency_code || "uzs"
    const amount = price?.amount || 1000

    logger.info(
      `[reviews-e2e-flow] Using product ${product.id} (${product.title}), variant ${variant.id}, price ${amount} ${currencyCode}`
    )

    //
    // 2) Create a synthetic customer that will place the order
    //
    const timestamp = Date.now()
    const email = `review-e2e+${timestamp}@toolbox.local`

    const customer = await customerModule.createCustomers({
      email,
      first_name: "Review",
      last_name: "Tester",
      phone: "+998900000000",
      has_account: false,
    })

    logger.info(
      `[reviews-e2e-flow] Created customer ${customer.id} (${email})`
    )

    //
    // 3) Create a COMPLETED order for this customer containing the product
    //
    const order = await (orderModuleService as any).createOrders({
      email,
      customer_id: customer.id,
      currency_code: currencyCode,
      items: [
        {
          title: product.title,
          quantity: 1,
          unit_price: amount,
          variant_id: variant.id,
        },
      ],
      status: "completed",
      payment_status: "captured",
      fulfillment_status: "fulfilled",
      metadata: {
        reviews_e2e: true,
        created_at: new Date().toISOString(),
      },
    })

    const orderId = Array.isArray(order) ? order[0].id : order.id

    if (!orderId) {
      throw new Error("[reviews-e2e-flow] Failed to create order")
    }

    logger.info(
      `[reviews-e2e-flow] Created completed order ${orderId} for customer ${customer.id}`
    )

    //
    // 4) Verify canReview() returns can_review = true for this product/customer
    //
    const eligibility = await reviewsModuleService.canReview(
      product.id,
      customer.id
    )

    if (!eligibility.can_review) {
      throw new Error(
        `[reviews-e2e-flow] Expected can_review=true but got false (reason=${eligibility.reason})`
      )
    }

    if (!eligibility.order_id) {
      throw new Error(
        "[reviews-e2e-flow] canReview() did not return an order_id"
      )
    }

    logger.info(
      `[reviews-e2e-flow] canReview() OK: can_review=true, order_id=${eligibility.order_id}`
    )

    //
    // 5) Create a pending review via the ReviewsService (simulating storefront POST)
    //
    const rating = 5
    const comment = `E2E review for product ${product.id} at ${new Date().toISOString()}`

    const review = await reviewsModuleService.createReviews({
      product_id: product.id,
      customer_id: customer.id,
      order_id: eligibility.order_id,
      rating,
      comment,
      status: "pending",
    } as any)

    logger.info(
      `[reviews-e2e-flow] Created review ${review.id} with status ${review.status}`
    )

    if (review.status !== "pending") {
      throw new Error(
        `[reviews-e2e-flow] Expected new review to be 'pending', got '${review.status}'`
      )
    }

    //
    // 6) Simulate admin moderation: approve the review
    //
    const approved = await reviewsModuleService.updateReviewStatus(
      review.id,
      "approved"
    )

    logger.info(
      `[reviews-e2e-flow] Review ${approved.id} status after moderation: ${approved.status}`
    )

    if (approved.status !== "approved") {
      throw new Error(
        `[reviews-e2e-flow] Expected review status 'approved' after moderation, got '${approved.status}'`
      )
    }

    //
    // 7) Verify the review is visible in the public list (storefront-facing domain)
    //
    const publicReviews =
      await reviewsModuleService.getProductReviews(product.id)

    const found = publicReviews.find((r: any) => r.id === approved.id)

    if (!found) {
      throw new Error(
        `[reviews-e2e-flow] Approved review ${approved.id} not returned by getProductReviews()`
      )
    }

    logger.info(
      `[reviews-e2e-flow] getProductReviews() returned the approved review as expected`
    )

    //
    // 8) Verify product rating metadata was recalculated (used by storefront/search)
    //
    const { data: productsAfter } = await query.graph({
      entity: "product",
      fields: ["id", "metadata"],
      filters: { id: product.id },
    })

    const updated = productsAfter?.[0]

    const ratingAvg = updated?.metadata?.rating_avg
    const ratingCount = updated?.metadata?.rating_count

    if (typeof ratingAvg !== "number" || typeof ratingCount !== "number") {
      throw new Error(
        `[reviews-e2e-flow] Expected product.metadata.rating_avg/count to be numbers, got avg=${ratingAvg}, count=${ratingCount}`
      )
    }

    if (ratingCount < 1) {
      throw new Error(
        `[reviews-e2e-flow] Expected rating_count >= 1 after approving review, got ${ratingCount}`
      )
    }

    logger.info(
      `[reviews-e2e-flow] Product rating metadata updated: rating_avg=${ratingAvg}, rating_count=${ratingCount}`
    )

    logger.info(
      "[reviews-e2e-flow] ✅ Full post-purchase review flow PASSED (order -> canReview -> review -> moderation -> storefront metadata)"
    )
  } catch (e: any) {
    logger.error(`[reviews-e2e-flow] 💥 FAILED: ${e?.message || e}`)
    // Ensure non-zero exit code for CI / verification scripts
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
}

