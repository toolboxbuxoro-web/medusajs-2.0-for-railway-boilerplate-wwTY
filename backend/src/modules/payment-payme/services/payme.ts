import {
  AbstractPaymentProvider,
  PaymentSessionStatus
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderWebhookPayload,
  WebhookActionResult
} from "@medusajs/framework/types"
import crypto from "crypto"

type Options = {
  payme_id: string
  payme_key: string
  payme_url?: string
}

type InjectedDependencies = {
  logger: Logger
}

interface PaymeSessionData {
  order_id: string
  amount: number
  currency: string
  payment_url?: string
  transaction_id?: string
  status?: string
  payme_transaction_id?: string
  payme_state?: number
  payme_create_time?: number
  payme_perform_time?: number
}

/**
 * Payme Payment Provider Service for Medusa 2.0.
 * Handles payment URL generation and session lifecycle.
 */
export class PaymePaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "payme"
  protected logger_: Logger
  protected options_: Options
  protected paymeUrl_: string

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)
    this.logger_ = container.logger

    // Trim credentials to avoid whitespace issues
    this.options_ = {
      payme_id: options.payme_id?.trim(),
      payme_key: options.payme_key?.trim(),
      payme_url: options.payme_url
    }

    // Priority: options.payme_url -> env PAYME_URL -> default
    this.paymeUrl_ = this.formatPaymeUrl(
      options.payme_url || process.env.PAYME_URL || "https://checkout.paycom.uz"
    )

  }

  private formatPaymeUrl(url: string): string {
    let formatted = url
    if (!formatted.startsWith("http")) {
      formatted = `https://${formatted}`
    }
    return formatted.replace(/\/$/, "")
  }

  /**
   * Generate Payme payment URL.
   * @param orderId - Cart ID used as order identifier.
   * @param amount - Amount in tiyin (Medusa 2.0 stores amounts in minor units).
   * @param currencyCode - Currency code (default UZS).
   */
  private generatePaymentUrl(orderId: string, amount: number, currencyCode: string = "UZS"): string {
    // Medusa 2.0 already stores amounts in minor units (tiyin for UZS)
    const amountForPayme = Math.round(amount)

    // Get Store URL for redirect after payment
    // Use STORE_URL (storefront) for redirect, not MEDUSA_BACKEND_URL
    const storeUrl = process.env.STORE_URL || "https://toolbox-tools.uz"
    const cleanStoreUrl = storeUrl.replace(/\/$/, "")
    
    // Use API callback route that handles locale redirect
    const returnUrl = `${cleanStoreUrl}/api/payme-callback`

    // Payme format: m=merchant_id;ac.order_id=order_id;a=amount;c=return_url
    const paramString = `m=${this.options_.payme_id};ac.order_id=${orderId};a=${amountForPayme};c=${returnUrl}`
    const encodedParams = Buffer.from(paramString).toString("base64")

    const paymentUrl = `${this.paymeUrl_}/${encodedParams}`

    return paymentUrl
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payment Provider Interface Methods
  // ─────────────────────────────────────────────────────────────────────────────

  async initiatePayment(input: any): Promise<any> {
    try {
      const { context, amount, currency_code } = input
      const orderId = context?.resource_id || crypto.randomUUID()


      const paymentUrl = this.generatePaymentUrl(orderId, amount as number, currency_code)

      const sessionData: PaymeSessionData = {
        order_id: orderId,
        amount: amount as number,
        currency: currency_code,
        payment_url: paymentUrl,
        status: "pending"
      }

      return { data: sessionData }
    } catch (error) {
      this.logger_.error(`[Payme] Error initiating payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_INITIATE_ERROR",
        detail: error
      }
    }
  }

  async authorizePayment(input: any): Promise<any> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData

      // Check if payment was completed by Payme (state=2 means performed)
      const isAuthorized = sessionData.payme_state === 2 || sessionData.transaction_id

      const status = isAuthorized
        ? PaymentSessionStatus.AUTHORIZED
        : PaymentSessionStatus.PENDING

      return {
        status,
        data: {
          ...sessionData,
          status: isAuthorized ? "authorized" : "pending"
        }
      }
    } catch (error) {
      this.logger_.error(`[Payme] Error authorizing payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_AUTHORIZE_ERROR",
        detail: error
      }
    }
  }

  async cancelPayment(input: any): Promise<any> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData

      this.logger_.info(`[Payme] Cancelling payment: order_id=${sessionData.order_id}`)

      return {
        data: {
          ...sessionData,
          status: "canceled"
        }
      }
    } catch (error) {
      this.logger_.error(`[Payme] Error canceling payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_CANCEL_ERROR",
        detail: error
      }
    }
  }

  async capturePayment(input: any): Promise<any> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData

      this.logger_.info(`[Payme] Capturing payment: order_id=${sessionData.order_id}`)

      return {
        data: {
          ...sessionData,
          status: "captured"
        }
      }
    } catch (error) {
      this.logger_.error(`[Payme] Error capturing payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_CAPTURE_ERROR",
        detail: error
      }
    }
  }

  async deletePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as PaymeSessionData
    return {
      data: {
        ...sessionData,
        status: "canceled"
      }
    }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const sessionData = (input.data || input) as PaymeSessionData

    // Check Payme's state for definitive status
    if (sessionData.payme_state === 2 || sessionData.status === "captured") {
      return PaymentSessionStatus.AUTHORIZED
    }

    if (sessionData.payme_state && sessionData.payme_state < 0) {
      return PaymentSessionStatus.CANCELED
    }

    if (sessionData.status === "canceled") {
      return PaymentSessionStatus.CANCELED
    }

    return PaymentSessionStatus.PENDING
  }

  async refundPayment(input: any): Promise<any> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData
      const refundAmount = input.amount || 0

      this.logger_.info(`[Payme] Refunding payment: order_id=${sessionData.order_id}, amount=${refundAmount}`)

      return {
        data: {
          ...sessionData,
          status: "refunded",
          refund_amount: refundAmount
        }
      }
    } catch (error) {
      this.logger_.error(`[Payme] Error refunding payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_REFUND_ERROR",
        detail: error
      }
    }
  }

  async retrievePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as PaymeSessionData
    return { data: sessionData }
  }

  async updatePayment(input: any): Promise<any> {
    try {
      const { data, context, amount, currency_code } = input
      const sessionData = data as PaymeSessionData

      this.logger_.info(`[Payme] Updating payment: order_id=${sessionData.order_id}`)

      // If amount changed, regenerate payment URL
      if (amount && amount !== sessionData.amount) {
        const currency = currency_code || sessionData.currency || "UZS"
        const paymentUrl = this.generatePaymentUrl(sessionData.order_id, amount as number, currency)

        return {
          data: {
            ...sessionData,
            amount,
            currency: currency_code || sessionData.currency,
            payment_url: paymentUrl
          }
        }
      }

      return {
        data: {
          ...sessionData,
          ...context
        }
      }
    } catch (error) {
      this.logger_.error(`[Payme] Error updating payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "PAYME_UPDATE_ERROR",
        detail: error
      }
    }
  }

  async getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    try {
      const payload = data.data as any

      if (payload?.status === "success" || payload?.transaction_id) {
        return {
          action: "authorized",
          data: {
            session_id: payload.order_id,
            amount: payload.amount ? Number(payload.amount) : 0
          }
        }
      }

      if (payload?.status === "canceled") {
        return {
          action: "failed",
          data: {
            session_id: payload.order_id,
            amount: payload.amount ? Number(payload.amount) : 0
          }
        }
      }

      return { action: "not_supported" }
    } catch (error) {
      this.logger_.error(`[Payme] Error processing webhook: ${(error as Error).message}`)
      return { action: "not_supported" }
    }
  }
}
