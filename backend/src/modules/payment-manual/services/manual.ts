import {
  AbstractPaymentProvider,
  PaymentSessionStatus
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderWebhookPayload,
  WebhookActionResult
} from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

/**
 * Manual Payment Provider (P0)
 * 
 * This provider auto-authorizes payments without external integration.
 * Intended for P0 mobile checkout testing only.
 * 
 * WARNING: Do not use in production - no actual payment is collected.
 */
export class ManualPaymentProviderService extends AbstractPaymentProvider<Record<string, unknown>> {
  static identifier = "manual"
  protected logger_: Logger

  constructor(container: InjectedDependencies, options: Record<string, unknown>) {
    super(container, options)
    this.logger_ = container.logger
  }

  async initiatePayment(input: any): Promise<any> {
    try {
      const { context, amount, currency_code } = input
      const orderId = context?.resource_id || `manual_${Date.now()}`

      this.logger_.info(`[Manual Provider] Auto-authorizing payment for order ${orderId}`)

      const sessionData = {
        order_id: orderId,
        amount: amount as number,
        currency: currency_code,
        status: "authorized",
        authorized_at: new Date().toISOString(),
      }

      return { data: sessionData }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error initiating payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_INITIATE_ERROR",
        detail: error
      }
    }
  }

  async authorizePayment(input: any): Promise<any> {
    try {
      const sessionData = input.data || input

      this.logger_.info(`[Manual Provider] Payment already authorized`)

      return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: {
          ...sessionData,
          status: "authorized"
        }
      }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error authorizing payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_AUTHORIZE_ERROR",
        detail: error
      }
    }
  }

  async cancelPayment(input: any): Promise<any> {
    try {
      const sessionData = input.data || input

      this.logger_.info(`[Manual Provider] Cancelling payment`)

      return {
        data: {
          ...sessionData,
          status: "canceled",
          canceled_at: new Date().toISOString()
        }
      }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error canceling payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_CANCEL_ERROR",
        detail: error
      }
    }
  }

  async capturePayment(input: any): Promise<any> {
    try {
      const sessionData = input.data || input

      this.logger_.info(`[Manual Provider] Capturing payment`)

      return {
        data: {
          ...sessionData,
          status: "captured",
          captured_at: new Date().toISOString()
        }
      }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error capturing payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_CAPTURE_ERROR",
        detail: error
      }
    }
  }

  async deletePayment(input: any): Promise<any> {
    // No-op for manual provider
    return { data: {} }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const sessionData = input.data || input
    const status = sessionData.status as string

    switch (status) {
      case "authorized":
        return { status: PaymentSessionStatus.AUTHORIZED }
      case "captured":
        return { status: PaymentSessionStatus.CAPTURED }
      case "canceled":
        return { status: PaymentSessionStatus.CANCELED }
      default:
        return { status: PaymentSessionStatus.PENDING }
    }
  }

  async refundPayment(input: any): Promise<any> {
    try {
      const sessionData = input.data || input
      const refundAmount = input.amount

      this.logger_.info(`[Manual Provider] Refunding payment: ${refundAmount}`)

      return {
        data: {
          ...sessionData,
          status: "refunded",
          refund_amount: refundAmount,
          refunded_at: new Date().toISOString()
        }
      }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error refunding payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_REFUND_ERROR",
        detail: error
      }
    }
  }

  async retrievePayment(input: any): Promise<any> {
    const sessionData = input.data || input
    return { data: sessionData }
  }

  async updatePayment(input: any): Promise<any> {
    try {
      const { amount, currency_code, data } = input

      return {
        data: {
          ...data,
          amount,
          currency_code,
          updated_at: new Date().toISOString()
        }
      }
    } catch (error) {
      this.logger_.error(`[Manual Provider] Error updating payment: ${(error as Error).message}`)
      return {
        error: (error as Error).message,
        code: "MANUAL_UPDATE_ERROR",
        detail: error
      }
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // Manual provider doesn't use webhooks
    return {
      action: "not_supported" as any,
    }
  }
}

export default ManualPaymentProviderService

