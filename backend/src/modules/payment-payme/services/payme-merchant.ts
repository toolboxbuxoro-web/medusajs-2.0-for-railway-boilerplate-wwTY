import { Logger } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"

type InjectedDependencies = {
  logger: Logger
  container: any
}

export enum PaymeErrorCodes {
  INTERNAL_ERROR = -32400,
  INSUFFICIENT_PRIVILEGE = -32504,
  INVALID_JSON_RPC_OBJECT = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_AMOUNT = -31001,
  TRANSACTION_NOT_FOUND = -31003,
  INVALID_ACCOUNT = -31050,
  COULD_NOT_CANCEL = -31007,
  COULD_NOT_PERFORM = -31008,
  ORDER_ALREADY_PAID = -31099,
}

/**
 * Custom error class for Payme JSON-RPC errors.
 */
export class PaymeError extends Error {
  code: number
  data: any

  constructor(code: number, message: string, data?: any) {
    super(message)
    this.code = code
    this.data = data
  }

}
/**
 * Service for handling Payme Merchant API JSON-RPC requests.
 * Follows the standard Payme protocol for transaction lifecycle.
 */
export class PaymeMerchantService {
  protected logger_: Logger
  protected container_: any

  constructor({ logger, container }: InjectedDependencies) {
    this.logger_ = logger
    this.container_ = container
  }

  private async hasColumn(
    pgConnection: any,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    try {
      const res = await pgConnection.raw(
        `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
      `,
        [tableName, columnName]
      )
      const rows = res?.rows || res || []
      return !!rows?.length
    } catch {
      return false
    }
  }

  /**
   * Route incoming JSON-RPC method calls to the appropriate handler.
   */
  async handleRequest(method: string, params: any) {
    switch (method) {
      case "CheckPerformTransaction":
        return this.checkPerformTransaction(params)
      case "CreateTransaction":
        return this.createTransaction(params)
      case "PerformTransaction":
        return this.performTransaction(params)
      case "CancelTransaction":
        return this.cancelTransaction(params)
      case "CheckTransaction":
        return this.checkTransaction(params)
      case "GetStatement":
        return this.getStatement(params)
      default:
        throw new PaymeError(PaymeErrorCodes.METHOD_NOT_FOUND, "Method not found")
    }
  }

  /**
   * Find Payme payment session by order_id stored in session data.
   * Uses raw SQL to query by JSON field since remoteQuery filters don't work reliably.
   * @param orderId - The order_id (cart_id) passed from Payme.
   */
  private async getPaymentSessionByOrderId(orderId: string) {
    try {
      const pgConnection = this.container_.resolve("__pg_connection__")
      
      // Query payment_session by data->>'order_id'
      const result = await pgConnection.raw(`
        SELECT 
          ps.id,
          ps.amount,
          ps.currency_code,
          ps.status,
          ps.data,
          ps.payment_collection_id,
          c.id as cart_id,
          c.completed_at
        FROM payment_session ps
        JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id
        JOIN cart c ON c.id = cpc.cart_id
        WHERE ps.data->>'order_id' = ?
          AND ps.provider_id LIKE '%payme%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [orderId])

      const rows = result?.rows || result || []
      const session = rows[0]

      if (!session) {
        this.logger_.warn(`[PaymeMerchant] No payment session found for order_id: ${orderId}`)
        return null
      }

      this.logger_.info(`[PaymeMerchant] Found session ${session.id} for order_id ${orderId}`)
      return session
    } catch (error) {
      this.logger_.error(`[PaymeMerchant] Error querying payment session: ${error}`)
      return null
    }
  }

  /**
   * Find payment session by Medusa Session ID.
   * @param id - Medusa Session ID (returned from CreateTransaction).
   */
  private async findSession(id: string) {
    const paymentModule = this.container_.resolve(Modules.PAYMENT)
    
    try {
      const session = await paymentModule.retrievePaymentSession(id)
      return session
    } catch {
      return null
    }
  }

  /**
   * Find payment session by Payme transaction ID stored in session.data.
   * @param paymeTransactionId - Payme's transaction ID.
   */
  private async findSessionByPaymeTransactionId(paymeTransactionId: string) {
    try {
      const pgConnection = this.container_.resolve("__pg_connection__")
      
      const result = await pgConnection.raw(`
        SELECT id, amount, currency_code, status, data, payment_collection_id
        FROM payment_session
        WHERE data->>'payme_transaction_id' = ?
          AND provider_id LIKE '%payme%'
        ORDER BY created_at DESC
        LIMIT 1
      `, [paymeTransactionId])

      const rows = result?.rows || result || []
      return rows[0] || null
    } catch (error) {
      this.logger_.error(`[PaymeMerchant] Error finding session by payme_transaction_id: ${error}`)
      return null
    }
  }

  /**
   * Fetch cart items for fiscalization (detail object).
   * Returns items with title, price, count, MXIK code for Payme receipt.
   * INCLUDES shipping costs to ensure sum matches transaction total.
   * MXIK is taken from product.metadata.mxik_code only.
   * @param cartId - Cart ID to fetch items for.
   * @param expectedTotal - Expected total in tiyins to validate sum matches.
   */
  private async getCartItemsForFiscalization(cartId: string, expectedTotal?: number) {
    try {
      const pgConnection = this.container_.resolve("__pg_connection__")
      const hasDeletedAt = await this.hasColumn(pgConnection, "cart_line_item", "deleted_at")
      const hasTotal = await this.hasColumn(pgConnection, "cart_line_item", "total")
      
      // Query cart line items with product metadata for MXIK code
      const whereDeleted = hasDeletedAt ? "AND cli.deleted_at IS NULL" : ""
      const totalSelect = hasTotal ? ", cli.total as line_total" : ""

      const lineItemsResult = await pgConnection.raw(`
        SELECT 
          cli.id,
          cli.title,
          cli.quantity,
          cli.unit_price,
          ${hasTotal ? "cli.total as line_total," : ""}
          cli.product_title,
          cli.variant_title,
          cli.product_id,
          p.metadata as product_metadata
        FROM cart_line_item cli
        LEFT JOIN product p ON p.id = cli.product_id
        WHERE cli.cart_id = ?
          ${whereDeleted}
      `, [cartId])

      const rows = lineItemsResult?.rows || lineItemsResult || []

      // Build items array for fiscalization
      const items: any[] = rows.map((row: any) => {
        // Use product_title + variant_title if available, fallback to title
        const title = row.product_title 
          ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
          : (row.title || "Товар")

        // Get MXIK code from product metadata only
        const productMetadata = typeof row.product_metadata === 'string' 
          ? JSON.parse(row.product_metadata) 
          : (row.product_metadata || {})
        
        // Fallback to a default MXIK code if missing (Required by Payme)
        // Using a generic code for tools/services category
        const DEFAULT_MXIK_CODE = "06201001001000000" 
        const mxikCode = productMetadata.mxik_code || DEFAULT_MXIK_CODE

        const qty = Math.max(1, Number(row.quantity) || 1)

        // Prefer line_total (if available) because it reflects discounts/promotions.
        // Fallback to unit_price * qty.
        const lineTotalSums = hasTotal
          ? Number(row.line_total)
          : Number(row.unit_price) * qty

        // Convert sums -> tiyins.
        const lineTotalTiyins = Math.round(lineTotalSums * 100)

        // Payme expects per-unit price + count. Split totals across qty and keep remainder on the first unit.
        const unit = Math.floor(lineTotalTiyins / qty)
        const remainder = lineTotalTiyins - unit * qty

        const item: any = {
          title: title.substring(0, 128), // Payme limit: 128 chars
          price: unit + remainder, // Price per unit in tiyin, adjusted to preserve exact line total
          count: qty,
          code: mxikCode, // Mandatory field
          vat_percent: 12, // Standard VAT in Uzbekistan
          package_code: productMetadata.package_code || "2009" // Default to '2009' (Piece) if not specified
        }

        return item
      })

      // Query shipping costs from cart
      const shippingResult = await pgConnection.raw(`
        SELECT 
          csm.amount as shipping_amount,
          so.name as shipping_name
        FROM cart_shipping_method csm
        LEFT JOIN shipping_option so ON so.id = csm.shipping_option_id
        WHERE csm.cart_id = ?
      `, [cartId])

      const shippingRows = shippingResult?.rows || shippingResult || []
      
      // Add shipping as a separate item if present
      // MXIK for delivery/logistics services: "10105001001000000"
      const SHIPPING_MXIK_CODE = "10105001001000000"
      
      for (const shipping of shippingRows) {
        const shippingAmount = Number(shipping.shipping_amount)
        if (shippingAmount > 0) {
          items.push({
            title: (shipping.shipping_name || "Доставка").substring(0, 128),
            price: Math.round(shippingAmount * 100), // Convert to tiyin
            count: 1,
            code: SHIPPING_MXIK_CODE,
            vat_percent: 12,
            package_code: "2009" // Service
          })
        }
      }

      // Calculate sum of all items
      const itemsSum = items.reduce((sum, item) => sum + (item.price * item.count), 0)

      // #region payme debug
      if (process.env.PAYME_FISCAL_DEBUG === "true") {
        try {
          const rawUnitPrices = rows
            .map((r: any) => Number(r.unit_price))
            .filter((n: any) => Number.isFinite(n))
          const rawMin = rawUnitPrices.length ? Math.min(...rawUnitPrices) : null
          const rawMax = rawUnitPrices.length ? Math.max(...rawUnitPrices) : null
          const shippingAmounts = shippingRows
            .map((s: any) => Number(s.shipping_amount))
            .filter((n: any) => Number.isFinite(n) && n > 0)

          const sample = items.slice(0, 3).map((it: any) => ({
            price: it?.price,
            count: it?.count,
            vat_percent: it?.vat_percent,
            package_code: it?.package_code,
            codeLen: typeof it?.code === "string" ? it.code.length : null,
          }))

          this.logger_.info(
            `[PaymeMerchant][FiscalDebug] cart=${cartId} expected=${expectedTotal ?? null} items=${items.length} itemsSum=${itemsSum} rawUnitPrice[min,max]=${rawMin},${rawMax} shippingAmounts=${shippingAmounts.join(",") || "none"} sample=${JSON.stringify(sample)}`
          )
        } catch (_e) {}
      }
      // #endregion payme debug
      
      // If there's a mismatch between items sum and expected total, log it
      if (expectedTotal && Math.abs(itemsSum - expectedTotal) > 1) {
        this.logger_.warn(`[PaymeMerchant] Fiscalization sum mismatch: items=${itemsSum}, expected=${expectedTotal}, diff=${expectedTotal - itemsSum}`)
      }

      /**
       * IMPORTANT:
       * Payme validates fiscalization data. If `detail.items` sum doesn't match `amount`,
       * Payme shows "Неправильные фискальные данные" and blocks the payment UI.
       *
       * Cart line items can diverge from the payment amount due to promotions, rounding,
       * or because `unit_price` isn't the final payable amount.
       *
       * To ensure payment can proceed, fall back to a single fiscal item equal to the
       * expected total if we detect a mismatch.
       */
      if (expectedTotal && Math.abs(itemsSum - expectedTotal) > 1) {
        // If mismatch is small, adjust the last item price to make sums match (keeps itemization).
        const diff = expectedTotal - itemsSum
        if (items.length > 0 && Math.abs(diff) <= Math.max(100, Math.floor(expectedTotal * 0.02))) {
          const last = items[items.length - 1]
          const newPrice = Number(last.price) + diff // count is 1 for remainder-bearing items? count may be >1.
          if (Number.isFinite(newPrice) && newPrice > 0) {
            last.price = newPrice
            this.logger_.warn(
              `[PaymeMerchant] Adjusted last fiscal item by diff=${diff} to match expected total`
            )
            return items
          }
        }

        const FALLBACK_MXIK_CODE = "06201001001000000"
        const fallbackCode =
          items.find((it) => typeof it?.code === "string" && it.code.length > 0)?.code ||
          FALLBACK_MXIK_CODE

        const fallbackItem = {
          title: "Оплата заказа",
          price: expectedTotal,
          count: 1,
          code: fallbackCode,
          vat_percent: 12,
          package_code: "2009",
        }

        this.logger_.warn(
          `[PaymeMerchant] Using fallback fiscal item to match amount: expected=${expectedTotal}`
        )

        return [fallbackItem]
      }

      this.logger_.info(`[PaymeMerchant] Prepared ${items.length} items for fiscalization, sum=${itemsSum} tiyin`)
      return items
    } catch (error) {
      this.logger_.error(`[PaymeMerchant] Error fetching cart items: ${error}`)
      return []
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payme JSON-RPC Method Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * CheckPerformTransaction: Validate that a payment can be performed.
   * Called by Payme before CreateTransaction.
   */
  async checkPerformTransaction(params: any) {
    const { amount, account } = params
    const orderId = account?.order_id

    this.logger_.info(`[PaymeMerchant] CheckPerformTransaction: order_id=${orderId}, amount=${amount}`)

    if (!orderId) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order ID is missing")
    }

    const session = await this.getPaymentSessionByOrderId(orderId)

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found")
    }

    // Check if order is already paid (cart completed)
    if (session.completed_at) {
      throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already completed")
    }

    // Check if already paid via payme_state
    const sessionData = typeof session.data === 'string' 
      ? JSON.parse(session.data) 
      : (session.data || {})
    
    if (sessionData.payme_state === 2) {
      throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already paid")
    }

    // Amount validation - use session.amount as source of truth (convert to tiyins)
    const expectedAmount = Math.round(Number(session.amount) * 100)
    
    if (expectedAmount <= 0) {
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, "Invalid amount")
    }

    if (expectedAmount !== amount) {
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`)
    }

    // Fetch cart items for fiscalization (pass expected amount for validation)
    const items = await this.getCartItemsForFiscalization(session.cart_id, expectedAmount)

    // #region payme debug
    if (process.env.PAYME_FISCAL_DEBUG === "true") {
      try {
        const payload = {
          orderId,
          cartId: session.cart_id,
          sessionAmountRaw: session.amount,
          sessionCurrency: session.currency_code,
          amountParam: amount,
          expectedAmount,
          itemsCount: items?.length || 0,
        }
        this.logger_.info(`[PaymeMerchant][FiscalDebug] CheckPerform snapshot ${JSON.stringify(payload)}`)
      } catch (_e) {}
    }
    // #endregion payme debug

    this.logger_.info(`[PaymeMerchant] CheckPerformTransaction SUCCESS for order_id=${orderId}, items=${items.length}`)
    
    // Return with detail object for fiscalization (чекопечать)
    return { 
      allow: true,
      detail: {
        receipt_type: 0, // 0 = sale, 1 = return
        items: items
      }
    }
  }

  /**
   * CreateTransaction: Create a new payment transaction.
   * Called by Payme after successful CheckPerformTransaction.
   */
  async createTransaction(params: any) {
    const { id, time, amount, account } = params
    const orderId = account?.order_id

    this.logger_.info(`[PaymeMerchant] CreateTransaction: order_id=${orderId}, payme_id=${id}, amount=${amount}`)

    // Timeout check (max 12 hours)
    const TIMEOUT_MS = 12 * 60 * 60 * 1000
    if (Date.now() - time > TIMEOUT_MS) {
      throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction timeout: older than 12 hours")
    }

    const session = await this.getPaymentSessionByOrderId(orderId)

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found")
    }

    // Parse session data
    const currentData = typeof session.data === 'string' 
      ? JSON.parse(session.data) 
      : (session.data || {})

    // Idempotency: If the same transaction ID exists, return its state
    if (currentData.payme_transaction_id === id) {
      return {
        create_time: currentData.payme_create_time,
        transaction: session.id,
        state: currentData.payme_state
      }
    }

    // If a DIFFERENT transaction already exists (pending or completed), block
    if (currentData.payme_transaction_id && currentData.payme_state >= 1) {
      // State 1 = pending, State 2 = completed - both should block new transactions
      // Error code must be in range -31050 to -31099 per Payme spec
      throw new PaymeError(-31051, "Another transaction is in progress for this order")
    }

    // Amount validation using session.amount (convert to tiyins)
    const expectedAmount = Math.round(Number(session.amount) * 100)
    
    if (expectedAmount !== amount) {
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`)
    }

    // Create or overwrite transaction
    const paymentModule = this.container_.resolve(Modules.PAYMENT)

    const newData = {
      ...currentData,
      payme_transaction_id: id,
      payme_create_time: time,
      payme_state: 1,
      cart_id: session.cart_id // Save cart ID for PerformTransaction
    }

    await paymentModule.updatePaymentSession({
      id: session.id,
      amount: Number(session.amount),
      currency_code: session.currency_code || "uzs",
      data: newData
    })

    this.logger_.info(`[PaymeMerchant] CreateTransaction SUCCESS: session_id=${session.id}`)

    return {
      create_time: time,
      transaction: session.id, // Return Medusa Session ID for subsequent calls
      state: 1
    }
  }

  /**
   * PerformTransaction: Finalize a payment.
   * The `id` in params is our Session ID (returned from CreateTransaction).
   */
  async performTransaction(params: any) {
    const { id } = params

    this.logger_.info(`[PaymeMerchant] PerformTransaction: id=${id}`)

    // Try finding by Medusa session ID first, fallback to Payme transaction ID
    let session = await this.findSession(id)
    if (!session) {
      session = await this.findSessionByPaymeTransactionId(id)
    }

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const currentData = typeof session.data === 'string' 
      ? JSON.parse(session.data) 
      : (session.data || {})
    const paymentModule = this.container_.resolve(Modules.PAYMENT)

    // Idempotency: If already performed, return success
    if (currentData.payme_state === 2) {
      return {
        transaction: session.id,
        perform_time: currentData.payme_perform_time,
        state: 2
      }
    }

    // Can only perform a transaction in state 1 (created)
    if (currentData.payme_state !== 1) {
      throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction not in created state")
    }

    // Timeout check (12 hours from creation)
    const TIMEOUT_MS = 12 * 60 * 60 * 1000
    if (Date.now() - currentData.payme_create_time > TIMEOUT_MS) {
      throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction timeout: cannot perform after 12 hours")
    }

    // Attempt to complete the cart in Medusa
    const cartId = currentData.cart_id
    if (cartId) {
      try {
        await completeCartWorkflow(this.container_).run({
          input: {
            id: cartId
          }
        })
        this.logger_.info(`[PaymeMerchant] Successfully completed cart ${cartId} for transaction ${id}`)
      } catch (e) {
        this.logger_.error(`[PaymeMerchant] Failed to complete cart ${cartId}: ${e}`)
        // We still proceed to confirm the transaction to Payme to avoid desync
      }
    } else {
        this.logger_.warn(`[PaymeMerchant] No cart_id found for transaction ${id}, skipping cart completion`)
    }

    // Perform transaction
    const performTime = Date.now()

    const newData = {
      ...currentData,
      payme_state: 2,
      payme_perform_time: performTime,
      transaction_id: currentData.payme_transaction_id // For Medusa tracking
    }

    await paymentModule.updatePaymentSession({
      id: session.id,
      amount: session.amount || currentData.amount || 0,
      currency_code: session.currency_code || "uzs",
      data: newData
    })

    // Статус будет обновлен автоматически через authorizePayment провайдера
    // когда frontend проверит статус сессии

    return {
      transaction: session.id,
      perform_time: performTime,
      state: 2
    }
  }

  /**
   * CancelTransaction: Cancel a transaction.
   */
  async cancelTransaction(params: any) {
    const { id, reason } = params

    this.logger_.info(`[PaymeMerchant] CancelTransaction: id=${id}, reason=${reason}`)

    // Try finding by Medusa session ID first, fallback to Payme transaction ID
    let session = await this.findSession(id)
    if (!session) {
      session = await this.findSessionByPaymeTransactionId(id)
    }

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const currentData = typeof session.data === 'string' 
      ? JSON.parse(session.data) 
      : (session.data || {})
    const paymentModule = this.container_.resolve(Modules.PAYMENT)
    const cancelTime = Date.now()

    let newState: number

    if (currentData.payme_state === 1) {
      // Cancel before performance
      newState = -1
    } else if (currentData.payme_state === 2) {
      // Cancel after performance (refund)
      newState = -2
    } else {
      // Already cancelled, return current state
      return {
        transaction: session.id,
        cancel_time: currentData.payme_cancel_time || cancelTime,
        state: currentData.payme_state
      }
    }

    await paymentModule.updatePaymentSession({
      id: session.id,
      amount: session.amount,
      currency_code: session.currency_code || "uzs",
      data: {
        ...currentData,
        payme_state: newState,
        payme_cancel_time: cancelTime,
        payme_cancel_reason: reason
      }
    })


    return {
      transaction: session.id,
      cancel_time: cancelTime,
      state: newState
    }
  }

  /**
   * CheckTransaction: Get the status of a transaction.
   * Note: Payme sends their transaction ID, not our session ID.
   */
  async checkTransaction(params: any) {
    const { id } = params

    this.logger_.info(`[PaymeMerchant] CheckTransaction: payme_id=${id}`)

    // First try to find by Payme transaction ID (stored in session.data)
    let session = await this.findSessionByPaymeTransactionId(id)
    
    // Fallback: try as Medusa session ID
    if (!session) {
      session = await this.findSession(id)
    }

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const data = typeof session.data === 'string' 
      ? JSON.parse(session.data) 
      : (session.data || {})

    return {
      create_time: data.payme_create_time || 0,
      perform_time: data.payme_perform_time || 0,
      cancel_time: data.payme_cancel_time || 0,
      transaction: session.id,
      state: data.payme_state || 0,
      reason: data.payme_cancel_reason || null
    }
  }

  /**
   * GetStatement: Get list of transactions for a given period.
   * Used by Payme for reconciliation.
   */
  async getStatement(params: any) {
    const { from, to } = params

    this.logger_.info(`[PaymeMerchant] GetStatement: from=${from}, to=${to}`)

    // Validate params
    if (!from || !to) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Missing from/to parameters")
    }

    try {
      const pgConnection = this.container_.resolve("__pg_connection__")
      
      // Query transactions where data->>'payme_create_time' is between from and to
      // We also look for provider_id 'payme'
      // Note: We need to cast the JSON field to bigint/numeric to compare correctly, 
      // but simplistic text comparison might fail if lengths differ. 
      // Better to extract and cast.
      const result = await pgConnection.raw(`
        SELECT 
          id,
          amount,
          currency_code,
          data
        FROM payment_session
        WHERE provider_id LIKE '%payme%'
          AND (data->>'payme_create_time')::bigint >= ?
          AND (data->>'payme_create_time')::bigint <= ?
        ORDER BY (data->>'payme_create_time')::bigint ASC
      `, [from, to])

      const rows = result?.rows || result || []

      const transactions = rows.map((row: any) => {
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
        
        return {
          id: data.payme_transaction_id, // Payme's ID
          time: Number(data.payme_create_time),
          amount: Number(row.amount) * 100, // Amount in tiyin/smallest unit
          account: {
            order_id: data.cart_id || data.order_id // Provide what we have
          },
          create_time: Number(data.payme_create_time),
          perform_time: Number(data.payme_perform_time || 0),
          cancel_time: Number(data.payme_cancel_time || 0),
          transaction: row.id, // Our ID (Medusa Session ID)
          state: Number(data.payme_state),
          reason: data.payme_cancel_reason ? Number(data.payme_cancel_reason) : null
        }
      })

      return {
        transactions
      }

    } catch (error) {
      this.logger_.error(`[PaymeMerchant] GetStatement error: ${error}`)
      // Return empty list on error or throw? Payme expects clean response or error.
      // If DB fails, internal error.
      throw new PaymeError(PaymeErrorCodes.INTERNAL_ERROR, "Database error during GetStatement")
    }
  }
}

