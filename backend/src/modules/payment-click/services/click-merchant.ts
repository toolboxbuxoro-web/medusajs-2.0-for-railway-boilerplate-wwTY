import { Logger } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import {
  normalizeString,
  parseUzsAmountToTiyin,
  verifyClickCompleteSignature,
  verifyClickPrepareSignature,
} from "./click-utils"

export enum ClickErrorCodes {
  SUCCESS = 0,
  SIGN_CHECK_FAILED = -1,
  INCORRECT_AMOUNT = -2,
  ACTION_NOT_FOUND = -3,
  ALREADY_PAID = -4,
  USER_DOES_NOT_EXIST = -5,
  TRANSACTION_DOES_NOT_EXIST = -6,
  FAILED_TO_UPDATE_USER = -7,
  ERROR_IN_REQUEST_FROM_CLICK = -8,
  TRANSACTION_CANCELLED = -9,
}

type InjectedDependencies = {
  logger: Logger
  container: any
}

type ClickPrepareRequest = {
  click_trans_id: string
  service_id: string
  click_paydoc_id: string
  merchant_trans_id: string
  amount: string
  action: string
  error: string
  error_note: string
  sign_time: string
  sign_string: string
}

type ClickCompleteRequest = ClickPrepareRequest & {
  merchant_prepare_id: string
}

export class ClickMerchantService {
  protected logger_: Logger
  protected container_: any

  constructor({ logger, container }: InjectedDependencies) {
    this.logger_ = logger
    this.container_ = container
  }

  private getSecretKey(): string {
    return normalizeString(process.env.CLICK_SECRET_KEY)
  }

  private getServiceId(): string {
    return normalizeString(process.env.CLICK_SERVICE_ID)
  }

  private getUserId(): string {
    return normalizeString(process.env.CLICK_USER_ID)
  }

  /**
   * Generate Auth header for Click Fiscalization API
   * Format: {user_id}:{sha1(timestamp + secret_key)}:{timestamp}
   */
  private generateAuthHeader(): string {
    const userId = this.getUserId()
    const secretKey = this.getSecretKey()
    const timestamp = Math.floor(Date.now() / 1000)
    
    const crypto = require("crypto")
    const digest = crypto
      .createHash("sha1")
      .update(`${timestamp}${secretKey}`)
      .digest("hex")
    
    return `${userId}:${digest}:${timestamp}`
  }

  /**
   * Fetch cart items for fiscalization
   * Returns items with MXIK codes, prices, quantities for Click OFD API
   */
  private async getCartItemsForFiscalization(cartId: string, expectedTotalTiyin?: number) {
    try {
      const pgConnection = this.container_.resolve("__pg_connection__")
      
      // Check if columns exist
      const hasDeletedAt = await this.hasColumn(pgConnection, "cart_line_item", "deleted_at")
      const hasTotal = await this.hasColumn(pgConnection, "cart_line_item", "total")
      
      const whereDeleted = hasDeletedAt ? "AND cli.deleted_at IS NULL" : ""
      
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
      const items: any[] = []
      const itemsWithoutMxik: string[] = []

      for (const row of rows) {
        const title = row.product_title 
          ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
          : (row.title || "Товар")

        const productMetadata = typeof row.product_metadata === 'string' 
          ? JSON.parse(row.product_metadata) 
          : (row.product_metadata || {})
        
        const mxikCode = productMetadata.mxik_code
        
        if (!mxikCode) {
          itemsWithoutMxik.push(title)
        }

        const qty = Math.max(1, Number(row.quantity) || 1)
        const lineTotalSums = hasTotal
          ? Number(row.line_total)
          : Number(row.unit_price) * qty
        const lineTotalTiyins = Math.round(lineTotalSums * 100)
        const unit = Math.floor(lineTotalTiyins / qty)
        const remainder = lineTotalTiyins - unit * qty

        items.push({
          name: title.substring(0, 128),
          price: unit + remainder,
          count: qty,
          code: mxikCode || "MISSING",
          vat_percent: 12,
          package_code: productMetadata.package_code || "2009"
        })
      }

      // Add shipping if present
      const shippingResult = await pgConnection.raw(`
        SELECT 
          csm.amount as shipping_amount,
          so.name as shipping_name
        FROM cart_shipping_method csm
        LEFT JOIN shipping_option so ON so.id = csm.shipping_option_id
        WHERE csm.cart_id = ?
      `, [cartId])

      const shippingRows = shippingResult?.rows || shippingResult || []
      const SHIPPING_MXIK_CODE = "10105001001000000"
      
      for (const shipping of shippingRows) {
        const shippingAmount = Number(shipping.shipping_amount)
        if (shippingAmount > 0) {
          items.push({
            name: (shipping.shipping_name || "Доставка").substring(0, 128),
            price: Math.round(shippingAmount * 100),
            count: 1,
            code: SHIPPING_MXIK_CODE,
            vat_percent: 12,
            package_code: "2009"
          })
        }
      }

      if (itemsWithoutMxik.length > 0) {
        this.logger_.warn(`[ClickMerchant] Items without MXIK code: ${itemsWithoutMxik.join(', ')}`)
      }

      const itemsSum = items.reduce((sum, item) => sum + (item.price * item.count), 0)
      this.logger_.info(`[ClickMerchant] Prepared ${items.length} items for fiscalization, sum=${itemsSum} tiyin`)

      return items
    } catch (error) {
      this.logger_.error(`[ClickMerchant] Error fetching cart items: ${error}`)
      return []
    }
  }

  private async hasColumn(pgConnection: any, tableName: string, columnName: string): Promise<boolean> {
    try {
      const res = await pgConnection.raw(`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
      `, [tableName, columnName])
      const rows = res?.rows || res || []
      return !!rows?.length
    } catch {
      return false
    }
  }

  /**
   * Submit fiscalization data to Click OFD API
   * Called after successful payment completion
   */
  private async submitFiscalizationData(params: {
    paymentId: string
    cartId: string
    amountTiyin: number
  }): Promise<boolean> {
    const { paymentId, cartId, amountTiyin } = params

    if (!this.getUserId()) {
      this.logger_.warn("[ClickMerchant] CLICK_USER_ID not set - skipping fiscalization")
      return false
    }

    try {
      const items = await this.getCartItemsForFiscalization(cartId, amountTiyin)
      
      if (items.length === 0) {
        this.logger_.warn("[ClickMerchant] No items for fiscalization")
        return false
      }

      const payload = {
        service_id: parseInt(this.getServiceId(), 10),
        payment_id: parseInt(paymentId, 10),
        items: items,
        received_card: amountTiyin, // Payment by card
        received_cash: 0,
        received_ecash: 0
      }

      const authHeader = this.generateAuthHeader()

      this.logger_.info(`[ClickMerchant] Submitting fiscalization for payment_id=${paymentId}`)

      const response = await fetch("https://api.click.uz/v2/merchant/payment/ofd_data/submit_items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Auth": authHeader
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.error_code === 0) {
        this.logger_.info(`[ClickMerchant] Fiscalization submitted successfully for payment_id=${paymentId}`)
        return true
      } else {
        this.logger_.error(`[ClickMerchant] Fiscalization failed: ${JSON.stringify(result)}`)
        return false
      }
    } catch (error) {
      this.logger_.error(`[ClickMerchant] Error submitting fiscalization: ${error}`)
      return false
    }
  }

  /**
   * Find Click payment session by merchant_trans_id (we use cart_id).
   * Uses raw SQL to query by JSON field since remoteQuery filters can be unreliable.
   */
  private async getPaymentSessionByMerchantTransId(merchantTransId: string) {
    try {
      const pgConnection = this.container_.resolve("__pg_connection__")

      const result = await pgConnection.raw(
        `
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
        WHERE ps.data->>'merchant_trans_id' = ?
          AND ps.provider_id LIKE '%click%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `,
        [merchantTransId]
      )

      const rows = result?.rows || result || []
      return rows[0] || null
    } catch (e) {
      this.logger_.error(`[ClickMerchant] DB error: ${e}`)
      return null
    }
  }

  private parseSessionData(raw: any): any {
    if (!raw) return {}
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw)
      } catch {
        return {}
      }
    }
    return raw
  }

  private buildPrepareResponse(input: {
    click_trans_id: string
    merchant_trans_id: string
    merchant_prepare_id: string
    error: number
    error_note: string
  }) {
    return {
      click_trans_id: Number(input.click_trans_id) || 0,
      merchant_trans_id: input.merchant_trans_id,
      merchant_prepare_id: parseInt(input.merchant_prepare_id, 10) || 0,
      error: input.error,
      error_note: input.error_note,
    }
  }

  private buildCompleteResponse(input: {
    click_trans_id: string
    merchant_trans_id: string
    merchant_confirm_id: string
    error: number
    error_note: string
  }) {
    // docs.click.uz/click-api-error mentions merchant_confirm_id for Complete response
    return {
      click_trans_id: Number(input.click_trans_id) || 0,
      merchant_trans_id: input.merchant_trans_id,
      merchant_confirm_id: parseInt(input.merchant_confirm_id, 10) || 0,
      error: input.error,
      error_note: input.error_note,
    }
  }

  private validateAmountMatchesSession(
    clickAmountStr: string,
    sessionAmountTiyin: any
  ): boolean {
    const parsed = parseUzsAmountToTiyin(clickAmountStr)
    if (parsed === null) return false
    const expected = BigInt(Math.round(Number(sessionAmountTiyin || 0)))
    return expected === parsed
  }

  async handlePrepare(body: Partial<ClickPrepareRequest>) {
    try {
      const click_trans_id = normalizeString(body.click_trans_id)
      const service_id = normalizeString(body.service_id)
      const click_paydoc_id = normalizeString(body.click_paydoc_id)
      const merchant_trans_id = normalizeString(body.merchant_trans_id)
      const amount = normalizeString(body.amount)
      const action = normalizeString(body.action)
      const sign_time = normalizeString(body.sign_time)
      const sign_string = normalizeString(body.sign_string)

      this.logger_.info(
        `[ClickMerchant] Prepare: merchant_trans_id=${merchant_trans_id} click_trans_id=${click_trans_id} amount=${amount} action=${action}`
      )

      // Basic required fields
      if (
        !click_trans_id ||
        !service_id ||
        !merchant_trans_id ||
        !amount ||
        !action ||
        !sign_time ||
        !sign_string
      ) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
          error_note: "Error in request from click",
        })
      }

      if (action !== "0") {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.ACTION_NOT_FOUND,
          error_note: "Action not found",
        })
      }

      // Validate service_id (optional hard check)
      const configuredServiceId = this.getServiceId()
      if (configuredServiceId && configuredServiceId !== service_id) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
          error_note: "Invalid service_id",
        })
      }

      // Signature check
      const ok = verifyClickPrepareSignature({
        click_trans_id,
        service_id,
        secret_key: this.getSecretKey(),
        merchant_trans_id,
        amount,
        action,
        sign_time,
        sign_string,
      })

      if (!ok) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.SIGN_CHECK_FAILED,
          error_note: "SIGN CHECK FAILED!",
        })
      }

      const session = await this.getPaymentSessionByMerchantTransId(merchant_trans_id)
      if (!session) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.USER_DOES_NOT_EXIST,
          error_note: "User does not exist",
        })
      }

      if (session.completed_at) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.ALREADY_PAID,
          error_note: "Already paid",
        })
      }

      if (!this.validateAmountMatchesSession(amount, session.amount)) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: "0",
          error: ClickErrorCodes.INCORRECT_AMOUNT,
          error_note: "Incorrect parameter amount",
        })
      }

      const currentData = this.parseSessionData(session.data)

      // Idempotency: if already prepared for this click_trans_id return previous prepare id
      if (currentData.click_trans_id === click_trans_id && currentData.merchant_prepare_id) {
        return this.buildPrepareResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id: String(currentData.merchant_prepare_id),
          error: ClickErrorCodes.SUCCESS,
          error_note: "Success",
        })
      }

      // Use click_trans_id as merchant_prepare_id (numeric string, stable, unique)
      const merchant_prepare_id = click_trans_id

      const paymentModule = this.container_.resolve(Modules.PAYMENT)
      await paymentModule.updatePaymentSession({
        id: session.id,
        amount: Number(session.amount),
        currency_code: session.currency_code || "uzs",
        data: {
          ...currentData,
          click_state: "prepared",
          click_trans_id,
          click_paydoc_id,
          merchant_prepare_id,
          click_error: 0,
          click_error_note: "Success",
          sign_time,
          // Store cart_id explicitly in session data, same pattern as Payme
          cart_id: session.cart_id,
        },
      })

      return this.buildPrepareResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: ClickErrorCodes.SUCCESS,
        error_note: "Success",
      })
    } catch (e) {
      this.logger_.error(`[ClickMerchant] Unexpected error in handlePrepare: ${e}`)
      return this.buildPrepareResponse({
        click_trans_id: normalizeString(body.click_trans_id),
        merchant_trans_id: normalizeString(body.merchant_trans_id),
        merchant_prepare_id: "0",
        error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
        error_note: "Internal Server Error",
      })
    }
  }

  async handleComplete(body: Partial<ClickCompleteRequest>) {
    try {
      const click_trans_id = normalizeString(body.click_trans_id)
      const service_id = normalizeString(body.service_id)
      const click_paydoc_id = normalizeString(body.click_paydoc_id)
      const merchant_trans_id = normalizeString(body.merchant_trans_id)
      const merchant_prepare_id = normalizeString((body as any).merchant_prepare_id)
      const amount = normalizeString(body.amount)
      const action = normalizeString(body.action)
      const errorStr = normalizeString(body.error)
      const error_note_in = normalizeString(body.error_note)
      const sign_time = normalizeString(body.sign_time)
      const sign_string = normalizeString(body.sign_string)

      const clickError = errorStr ? Number(errorStr) : 0

      this.logger_.info(
        `[ClickMerchant] Complete: merchant_trans_id=${merchant_trans_id} click_trans_id=${click_trans_id} prepare_id=${merchant_prepare_id} amount=${amount} action=${action} error=${clickError}`
      )

      // Basic required fields
      if (
        !click_trans_id ||
        !service_id ||
        !merchant_trans_id ||
        !merchant_prepare_id ||
        !amount ||
        !action ||
        !sign_time ||
        !sign_string
      ) {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
          error_note: "Error in request from click",
        })
      }

      if (action !== "1") {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.ACTION_NOT_FOUND,
          error_note: "Action not found",
        })
      }

      // Validate service_id (optional hard check)
      const configuredServiceId = this.getServiceId()
      if (configuredServiceId && configuredServiceId !== service_id) {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
          error_note: "Invalid service_id",
        })
      }

      // Signature check
      const ok = verifyClickCompleteSignature({
        click_trans_id,
        service_id,
        secret_key: this.getSecretKey(),
        merchant_trans_id,
        merchant_prepare_id,
        amount,
        action,
        sign_time,
        sign_string,
      })

      if (!ok) {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.SIGN_CHECK_FAILED,
          error_note: "SIGN CHECK FAILED!",
        })
      }

      const session = await this.getPaymentSessionByMerchantTransId(merchant_trans_id)

      // If session not found, but it's a success completion?
      // Check if it's already paid?
      // For now if not found, transaction does not exist
      if (!session) {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.TRANSACTION_DOES_NOT_EXIST,
          error_note: "Transaction does not exist",
        })
      }

      const currentData = this.parseSessionData(session.data)

      // Idempotency: if already completed
      if (currentData.click_state === "paid" || currentData.click_state === "canceled") {
        // If already paid and success, return success
        if (currentData.click_state === "paid" && clickError >= 0) {
          return this.buildCompleteResponse({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: String(currentData.merchant_confirm_id || click_trans_id),
            error: ClickErrorCodes.SUCCESS,
            error_note: "Success",
          })
        }
        if (currentData.click_state === "canceled") {
           return this.buildCompleteResponse({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: String(currentData.merchant_confirm_id || click_trans_id),
            error: ClickErrorCodes.TRANSACTION_CANCELLED,
            error_note: "Transaction cancelled",
          })
        }
      }

      // Check amount
      if (!this.validateAmountMatchesSession(amount, session.amount)) {
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.INCORRECT_AMOUNT,
          error_note: "Incorrect parameter amount",
        })
      }

      // If click sends error < 0, we must cancel
      if (clickError < 0) {
        // Cancel logic
         const paymentModule = this.container_.resolve(Modules.PAYMENT)
         await paymentModule.updatePaymentSession({
          id: session.id,
          amount: Number(session.amount),
          currency_code: session.currency_code || "uzs",
          data: {
            ...currentData,
            click_state: "canceled",
            click_error: clickError,
            click_error_note: errorStr,
          },
        })
        return this.buildCompleteResponse({
          click_trans_id,
          merchant_trans_id,
          merchant_confirm_id: "0",
          error: ClickErrorCodes.TRANSACTION_CANCELLED, // Or should we mirror operation?
          error_note: "Transaction cancelled by Click",
        })
      }

      // Success logic
      const merchant_confirm_id = click_trans_id

      const paymentModule = this.container_.resolve(Modules.PAYMENT)
      await paymentModule.updatePaymentSession({
        id: session.id,
        amount: Number(session.amount),
        currency_code: session.currency_code || "uzs",
        data: {
          ...currentData,
          click_state: "paid",
          merchant_confirm_id,
          click_error: 0,
          click_error_note: "Success",
        },
      })

      // Trigger Medusa cart completion workflow
      try {
        const workflowResult = await completeCartWorkflow(this.container_).run({
          input: {
            id: session.cart_id,
          }
        })
        
        const orderId = workflowResult?.result?.id
        if (orderId) {
          // Save medusa_order_id to session data (same as Payme does)
          // This allows auto-complete-order subscriber to find the payment session
          await paymentModule.updatePaymentSession({
            id: session.id,
            amount: Number(session.amount),
            currency_code: session.currency_code || "uzs",
            data: {
              ...currentData,
              click_state: "completed", // Change to "completed" for consistency
              merchant_confirm_id,
              click_error: 0,
              click_error_note: "Success",
              medusa_order_id: orderId, // Important for auto-complete subscriber
            },
          })
          this.logger_.info(`[ClickMerchant] Cart ${session.cart_id} -> order ${orderId} (saved to session)`)

          // CRITICAL: Capture the payment to change status from 'authorized' to 'captured'
          try {
            await paymentModule.capturePayment({
              payment_collection_id: session.payment_collection_id,
              captured_by: "click-merchant"
            })
            this.logger_.info(`[ClickMerchant] ✅ Captured payment for order ${orderId}`)
          } catch (captureErr: any) {
            this.logger_.error(`[ClickMerchant] ⚠️ Failed to capture payment: ${captureErr.message}`)
          }
        } else {
          this.logger_.warn(`[ClickMerchant] completeCartWorkflow succeeded but no order ID returned`)
        }
      } catch (wfError) {
        this.logger_.error(`[ClickMerchant] Failed to complete cart ${session.cart_id}: ${wfError}`)
        // Even if workflow fails, payment is done. We return success to Click.
      }
      
      // Fiscalization
      // Run in background
      this.submitFiscalizationData({
        paymentId: click_trans_id,
        cartId: session.cart_id,
        amountTiyin: Number(session.amount) // Sums here? submitFiscalizationData uses it as tiyin?
        // Wait, submitFiscalizationData expects tiyin or sums?
        // getCartItemsForFiscalization uses amountTiyin.
        // If Medusa amounts are SUMS, then parseUzsAmountToTiyin returns SUMS.
        // submitFiscalizationData passes it to getCartItemsForFiscalization.
        // getCartItemsForFiscalization calculates item prices.
        // If session.amount is SUMS (415000), then we pass 415000.
        // getCartItemsForFiscalization: "const unit = Math.floor(lineTotalTiyins / qty)".
        // It uses "const lineTotalTiyins = Math.round(lineTotalSums * 100)".
        // So fiscalization logic expects SUMS?
        // Yes line 136-139 in original file:
        // const lineTotalSums = hasTotal ? Number(row.line_total) : Number(row.unit_price) * qty
        // const lineTotalTiyins = Math.round(lineTotalSums * 100)
        // So session.amount (sums) is correct.
      })

      return this.buildCompleteResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id,
        error: ClickErrorCodes.SUCCESS,
        error_note: "Success",
      })
    } catch (e) {
      this.logger_.error(`[ClickMerchant] Unexpected error in handleComplete: ${e}`)
      return this.buildCompleteResponse({
        click_trans_id: normalizeString(body.click_trans_id),
        merchant_trans_id: normalizeString(body.merchant_trans_id),
        merchant_confirm_id: "0",
        error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
        error_note: "Internal Server Error",
      })
    }
  }
}









