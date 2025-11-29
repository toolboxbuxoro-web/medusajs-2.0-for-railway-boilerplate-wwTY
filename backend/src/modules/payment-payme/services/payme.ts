import { 
  AbstractPaymentProvider, 
  PaymentSessionStatus
} from "@medusajs/framework/utils"
import { 
  Logger,
  ProviderWebhookPayload,
  WebhookActionResult,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession
} from "@medusajs/framework/types"
import crypto from "crypto"

type Options = {
  payme_id: string
  payme_key: string
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
}

export class PaymePaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "payme"
  protected logger_: Logger
  protected options_: Options
  protected paymeUrl_ = "https://checkout.paycom.uz"

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    
    this.logger_.info("Payme Payment Provider initialized", {
      payme_id: options.payme_id,
      has_key: !!options.payme_key
    })
  }

  /**
   * Generate Payme payment URL
   */
  private generatePaymentUrl(orderId: string, amount: number): string {
    // Amount should be in tiyin (1 UZS = 100 tiyin)
    const amountInTiyin = Math.round(amount)
    
    // Create params object
    const params = {
      m: this.options_.payme_id,
      ac: {
        order_id: orderId
      },
      a: amountInTiyin,
      c: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:9000'}/store/payme/callback`
    }
    
    // Encode params to base64
    const encodedParams = Buffer.from(JSON.stringify(params)).toString('base64')
    
    const paymentUrl = `${this.paymeUrl_}/${encodedParams}`
    
    this.logger_.info("Generated Payme payment URL", {
      order_id: orderId,
      amount: amountInTiyin,
      url: paymentUrl
    })
    
    return paymentUrl
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const { context, amount, currency_code } = input
      const orderId = context.resource_id || crypto.randomUUID()
      
      this.logger_.info("Initiating Payme payment", {
        order_id: orderId,
        amount,
        currency: currency_code
      })

      // Generate payment URL
      const paymentUrl = this.generatePaymentUrl(orderId, amount)

      const sessionData: PaymeSessionData = {
        order_id: orderId,
        amount,
        currency: currency_code,
        payment_url: paymentUrl,
        status: "pending"
      }

      return {
        data: sessionData
      }
    } catch (error) {
      this.logger_.error("Error initiating Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_INITIATE_ERROR",
        detail: error
      }
    }
  }

  async authorizePayment(
    input: any
  ): Promise<
    | PaymentProviderError
    | {
        status: PaymentSessionStatus
        data: PaymentProviderSessionResponse["data"]
      }
  > {
    console.log("Authorizing Payme payment", { input })
    
    try {
      const sessionData = (input.data || input) as PaymeSessionData
      
      this.logger_.info("Authorizing Payme payment", {
        order_id: sessionData.order_id,
        transaction_id: sessionData.transaction_id
      })

      // In a real implementation, you would verify the payment with Payme API
      // For now, we'll mark it as authorized if we have a transaction_id
      const status = sessionData.transaction_id ? 
        PaymentSessionStatus.AUTHORIZED : 
        PaymentSessionStatus.PENDING

      return {
        status,
        data: {
          ...sessionData,
          status: status === PaymentSessionStatus.AUTHORIZED ? "authorized" : "pending"
        }
      }
    } catch (error) {
      this.logger_.error("Error authorizing Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_AUTHORIZE_ERROR",
        detail: error
      }
    }
  }

  async cancelPayment(
    input: any
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData
      
      this.logger_.info("Canceling Payme payment", {
        order_id: sessionData.order_id
      })

      return {
        data: {
          ...sessionData,
          status: "canceled"
        }
      }
    } catch (error) {
      this.logger_.error("Error canceling Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_CANCEL_ERROR",
        detail: error
      }
    }
  }

  async capturePayment(
    input: any
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData
      
      this.logger_.info("Capturing Payme payment", {
        order_id: sessionData.order_id,
        transaction_id: sessionData.transaction_id
      })

      return {
        data: {
          ...sessionData,
          status: "captured"
        }
      }
    } catch (error) {
      this.logger_.error("Error capturing Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_CAPTURE_ERROR",
        detail: error
      }
    }
  }

  async deletePayment(
    input: any
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const sessionData = (input.data || input) as PaymeSessionData
    return {
      data: {
        ...sessionData,
        status: "canceled"
      }
    }
  }

  async getPaymentStatus(
    input: any
  ): Promise<PaymentSessionStatus> {
    const sessionData = (input.data || input) as PaymeSessionData
    
    if (sessionData.transaction_id || sessionData.status === "authorized" || sessionData.status === "captured") {
      return PaymentSessionStatus.AUTHORIZED
    }
    
    if (sessionData.status === "canceled") {
      return PaymentSessionStatus.CANCELED
    }
    
    return PaymentSessionStatus.PENDING
  }

  async refundPayment(
    input: any
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const sessionData = (input.data || input) as PaymeSessionData
      const refundAmount = input.amount || 0;
      
      this.logger_.info("Refunding Payme payment", {
        order_id: sessionData.order_id,
        refund_amount: refundAmount
      })

      return {
        data: {
          ...sessionData,
          status: "refunded",
          refund_amount: refundAmount
        }
      }
    } catch (error) {
      this.logger_.error("Error refunding Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_REFUND_ERROR",
        detail: error
      }
    }
  }

  async retrievePayment(
    input: any
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const sessionData = (input.data || input) as PaymeSessionData
    return {
      data: sessionData
    }
  }

  async updatePayment(
    input: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const { data, context, amount, currency_code } = input
      const sessionData = data as PaymeSessionData

      this.logger_.info("Updating Payme payment", {
        order_id: sessionData.order_id,
        new_amount: amount
      })

      // If amount changed, regenerate payment URL
      if (amount && amount !== sessionData.amount) {
        const paymentUrl = this.generatePaymentUrl(sessionData.order_id, amount)
        
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
      this.logger_.error("Error updating Payme payment", error)
      return {
        error: error.message,
        code: "PAYME_UPDATE_ERROR",
        detail: error
      }
    }
  }
  
  async getWebhookActionAndData(
    data: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      this.logger_.info("Processing Payme webhook", data)
      
      // Handle payment success callback
      if (data.status === "success" || data.transaction_id) {
        return {
          action: "authorized",
          data: {
            session_id: data.order_id,
            amount: data.amount
          }
        }
      }
      
      // Handle payment cancellation
      if (data.status === "canceled") {
        return {
          action: "failed",
          data: {
            session_id: data.order_id
          }
        }
      }
      
      return {
        action: "not_supported"
      }
    } catch (error) {
      this.logger_.error("Error processing Payme webhook", error)
      return {
        action: "not_supported"
      }
    }
  }
}
