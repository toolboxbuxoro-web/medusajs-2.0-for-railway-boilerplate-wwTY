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

    // Amount validation - use session.amount as source of truth
    const expectedAmount = Math.round(Number(session.amount))
    
    if (expectedAmount <= 0) {
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, "Invalid amount")
    }

    if (expectedAmount !== amount) {
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`)
    }

    this.logger_.info(`[PaymeMerchant] CheckPerformTransaction SUCCESS for order_id=${orderId}`)
    return { allow: true }
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

    // If a DIFFERENT transaction already exists and was completed, block
    if (currentData.payme_transaction_id && currentData.payme_state === 2) {
      throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already paid")
    }

    // Amount validation using session.amount
    const expectedAmount = Math.round(Number(session.amount))
    
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


    const session = await this.findSession(id)

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const currentData = session.data || {}
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


    const session = await this.findSession(id)

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const currentData = session.data || {}
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
   */
  async checkTransaction(params: any) {
    const { id } = params


    const session = await this.findSession(id)

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found")
    }

    const data = session.data || {}

    return {
      create_time: data.payme_create_time || 0,
      perform_time: data.payme_perform_time || 0,
      cancel_time: data.payme_cancel_time || 0,
      transaction: session.id,
      state: data.payme_state || 0,
      reason: data.payme_cancel_reason || null
    }
  }

}
