import { Logger } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

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
      case "GetStatement":
        return this.getStatement(params)
      default:
        throw new PaymeError(PaymeErrorCodes.METHOD_NOT_FOUND, "Method not found")
    }
  }

  /**
   * Retrieve Payme payment session from a cart.
   * @param cartId - The Medusa Cart ID (used as order_id).
   */
  private async getPaymentSession(cartId: string) {
    const remoteQuery = this.container_.resolve("remoteQuery")

    const query = await remoteQuery({
      entryPoint: "cart",
      fields: [
        "id",
        "total",
        "currency_code",
        "payment_collection.payment_sessions.id",
        "payment_collection.payment_sessions.provider_id",
        "payment_collection.payment_sessions.data",
        "payment_collection.payment_sessions.amount",
        "payment_collection.payment_sessions.status"
      ],
      filters: { id: cartId }
    })

    const cart = query[0]

    if (!cart) {
      this.logger_.warn(`[PaymeMerchant] Cart not found for id: ${cartId}`)
      return null
    }

    const session = cart.payment_collection?.payment_sessions?.find(
      (s: any) => s.provider_id?.includes("payme")
    )

    return { cart, session }
  }

  /**
   * Find a Medusa Payment Session by Payme's transaction ID.
   * This is a fallback lookup when we can't find by Medusa Session ID.
   * @param paymeTransactionId - Payme's transaction ID.
   */
  private async findSessionByPaymeTransactionId(paymeTransactionId: string) {
    const remoteQuery = this.container_.resolve("remoteQuery")

    try {
      const allSessions = await remoteQuery({
        entryPoint: "payment_session",
        fields: ["id", "provider_id", "data", "amount", "status", "currency_code"]
      })

      const session = allSessions.find((s: any) => {
        const data = s.data || {}
        return data.payme_transaction_id === paymeTransactionId
      })

      return session || null
    } catch (e) {
      this.logger_.error(`[findSessionByPaymeTransactionId] Error: ${(e as Error).message}`)
      return null
    }
  }

  /**
   * Robust session lookup: first by Medusa Session ID, then by Payme Transaction ID.
   * @param id - The ID to look up (could be either).
   */
  private async findSession(id: string) {
    const paymentModule = this.container_.resolve(Modules.PAYMENT)

    // 1. Try to find by Medusa Session ID
    try {
      const session = await paymentModule.retrievePaymentSession(id)
      if (session) {
        return session
      }
    } catch {
      // Not found by Session ID, continue to fallback
    }

    // 2. Fallback: Find by Payme Transaction ID
    const session = await this.findSessionByPaymeTransactionId(id)
    if (session) {
      return session
    }

    return null
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

    this.logger_.info(`[CheckPerformTransaction] orderId=${orderId}, amount=${amount}`)

    if (!orderId) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order ID is missing")
    }

    const result = await this.getPaymentSession(orderId)

    if (!result || !result.cart) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found")
    }

    const { cart, session } = result

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Payment session not found")
    }

    // Check if order is already paid
    if (session.data?.payme_state === 2) {
      throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already paid")
    }

    // Amount validation
    const expectedAmount = this.getExpectedAmount(session, cart)

    if (expectedAmount !== amount) {
      this.logger_.error(`[CheckPerformTransaction] Amount mismatch: expected=${expectedAmount}, got=${amount}`)
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`)
    }

    this.logger_.info(`[CheckPerformTransaction] Validation passed`)
    return { allow: true }
  }

  /**
   * CreateTransaction: Create a new payment transaction.
   * Called by Payme after successful CheckPerformTransaction.
   */
  async createTransaction(params: any) {
    const { id, time, amount, account } = params
    const orderId = account?.order_id

    this.logger_.info(`[CreateTransaction] id=${id}, orderId=${orderId}, amount=${amount}`)

    // Timeout check (max 12 hours)
    const TIMEOUT_MS = 12 * 60 * 60 * 1000
    if (Date.now() - time > TIMEOUT_MS) {
      throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction timeout: older than 12 hours")
    }

    const result = await this.getPaymentSession(orderId)

    if (!result || !result.cart) {
      throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found")
    }

    const { cart, session } = result

    if (!session) {
      throw new PaymeError(PaymeErrorCodes.INTERNAL_ERROR, "Payment session not found. Please initiate payment first.")
    }

    const currentData = session.data || {}

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

    // Amount validation
    const expectedAmount = this.getExpectedAmount(session, cart)

    if (expectedAmount !== amount) {
      this.logger_.error(`[CreateTransaction] Amount mismatch: expected=${expectedAmount}, got=${amount}`)
      throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`)
    }

    // Create or overwrite transaction
    const paymentModule = this.container_.resolve(Modules.PAYMENT)

    const newData = {
      ...currentData,
      payme_transaction_id: id,
      payme_create_time: time,
      payme_state: 1
    }

    await paymentModule.updatePaymentSession({
      id: session.id,
      amount: session.amount,
      currency_code: cart.currency_code || "uzs",
      data: newData
    })

    this.logger_.info(`[CreateTransaction] Created transaction for session=${session.id}`)

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

    this.logger_.info(`[PerformTransaction] id=${id}`)

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

    this.logger_.info(`[PerformTransaction] Performed transaction for session=${session.id}`)

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

    this.logger_.info(`[CancelTransaction] id=${id}, reason=${reason}`)

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

    this.logger_.info(`[CancelTransaction] Cancelled session=${session.id}, newState=${newState}`)

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

    this.logger_.info(`[CheckTransaction] id=${id}`)

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

  /**
   * GetStatement: Return list of transactions in a time range.
   * Placeholder implementation.
   */
  async getStatement(params: any) {
    return { transactions: [] }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get the expected amount for validation.
   * Priority: session.data.amount (from URL) > cart.total
   */
  private getExpectedAmount(session: any, cart: any): number {
    const sessionData = session.data || {}
    return sessionData.amount ? Math.round(sessionData.amount) : Math.round(cart.total)
  }
}
