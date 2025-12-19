import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import crypto from "crypto"
import { formatTiyinToUzsAmount, normalizeString } from "./click-utils"

type Options = {
  merchant_id: string
  service_id: string
  secret_key: string
  pay_url?: string
  merchant_user_id?: string
  card_type?: "uzcard" | "humo"
}

type InjectedDependencies = {
  logger: Logger
}

export interface ClickSessionData {
  merchant_trans_id: string
  amount_tiyin: number
  amount: string // sums as string (N.NN) used for redirect/widget
  currency: string
  payment_url?: string
  click_state?: "pending" | "prepared" | "completed" | "cancelled" | "error"
  click_trans_id?: string
  click_paydoc_id?: string
  merchant_prepare_id?: string
  click_error?: number
  click_error_note?: string
  sign_time?: string
  mode?: "redirect" | "pay_by_card"
  // Public config that frontend can use for checkout.js (pay-by-card)
  public_config?: {
    merchant_id: string
    service_id: string
    merchant_user_id?: string
    card_type?: "uzcard" | "humo"
  }
}

function formatBaseUrl(url: string): string {
  let u = url
  if (!u.startsWith("http")) u = `https://${u}`
  return u.replace(/\/$/, "")
}

function buildClickPayUrl(params: Record<string, string | undefined>, payUrl: string) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}`.length) {
      qs.set(k, `${v}`)
    }
  }
  return `${payUrl}?${qs.toString()}`
}

/**
 * Click redirect payment provider (my.click.uz/services/pay).
 */
export class ClickPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "click"

  protected logger_: Logger
  protected options_: Options
  protected payUrl_: string

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)
    this.logger_ = container.logger

    this.options_ = {
      merchant_id: normalizeString(options.merchant_id),
      service_id: normalizeString(options.service_id),
      secret_key: normalizeString(options.secret_key),
      pay_url: options.pay_url,
      merchant_user_id: normalizeString(options.merchant_user_id) || undefined,
      card_type: options.card_type,
    }

    this.payUrl_ = formatBaseUrl(
      options.pay_url || process.env.CLICK_PAY_URL || "https://my.click.uz/services/pay"
    )
  }

  private getStoreReturnUrl(): string {
    const storeUrl = process.env.STORE_URL || "https://toolbox-tools.uz"
    const cleanStoreUrl = storeUrl.replace(/\/$/, "")
    return `${cleanStoreUrl}/api/click-callback`
  }

  private generatePaymentUrl(merchantTransId: string, amountTiyin: number): string {
    const amount = formatTiyinToUzsAmount(amountTiyin)
    const returnUrl = this.getStoreReturnUrl()

    // docs.click.uz/click-button
    return buildClickPayUrl(
      {
        service_id: this.options_.service_id,
        merchant_id: this.options_.merchant_id,
        amount,
        transaction_param: merchantTransId,
        return_url: returnUrl,
        card_type: this.options_.card_type,
      },
      this.payUrl_
    )
  }

  async initiatePayment(input: any): Promise<any> {
    try {
      const { context, amount, currency_code } = input
      const merchantTransId =
        context?.resource_id || crypto.randomUUID().replace(/-/g, "")

      const paymentUrl = this.generatePaymentUrl(merchantTransId, Number(amount))

      const sessionData: ClickSessionData = {
        merchant_trans_id: merchantTransId,
        amount_tiyin: Number(amount),
        amount: formatTiyinToUzsAmount(Number(amount)),
        currency: currency_code || "uzs",
        payment_url: paymentUrl,
        click_state: "pending",
        mode: "redirect",
        public_config: {
          merchant_id: this.options_.merchant_id,
          service_id: this.options_.service_id,
          merchant_user_id: this.options_.merchant_user_id,
          card_type: this.options_.card_type,
        },
      }

      return { data: sessionData }
    } catch (error) {
      this.logger_.error(
        `[Click] Error initiating payment: ${(error as Error).message}`
      )
      return {
        error: (error as Error).message,
        code: "CLICK_INITIATE_ERROR",
        detail: error,
      }
    }
  }

  async authorizePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData

    // Mark authorized when our Click callback (Complete) succeeded
    const isAuthorized =
      sessionData.click_state === "completed" ||
      (sessionData.click_error === 0 && sessionData.merchant_prepare_id)

    const isCancelled =
      sessionData.click_state === "cancelled" ||
      (typeof sessionData.click_error === "number" && sessionData.click_error < 0)

    const status = isAuthorized
      ? PaymentSessionStatus.AUTHORIZED
      : isCancelled
        ? PaymentSessionStatus.CANCELED
        : PaymentSessionStatus.PENDING

    return {
      status,
      data: {
        ...sessionData,
      },
    }
  }

  async cancelPayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    return {
      data: {
        ...sessionData,
        click_state: "cancelled",
      },
    }
  }

  async capturePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    return { data: { ...sessionData } }
  }

  async deletePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    return { data: { ...sessionData, click_state: "cancelled" } }
  }

  async getPaymentStatus(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    if (sessionData.click_state === "completed") {
      return PaymentSessionStatus.AUTHORIZED
    }
    if (sessionData.click_state === "cancelled") {
      return PaymentSessionStatus.CANCELED
    }
    if (typeof sessionData.click_error === "number" && sessionData.click_error < 0) {
      return PaymentSessionStatus.CANCELED
    }
    return PaymentSessionStatus.PENDING
  }

  async refundPayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    return {
      data: {
        ...sessionData,
        click_state: "cancelled",
      },
    }
  }

  async retrievePayment(input: any): Promise<any> {
    const sessionData = (input.data || input) as ClickSessionData
    return { data: sessionData }
  }

  async updatePayment(input: any): Promise<any> {
    const { data, amount } = input
    const sessionData = data as ClickSessionData

    if (amount && Number(amount) !== Number(sessionData.amount_tiyin)) {
      const paymentUrl = this.generatePaymentUrl(
        sessionData.merchant_trans_id,
        Number(amount)
      )
      return {
        data: {
          ...sessionData,
          amount_tiyin: Number(amount),
          amount: formatTiyinToUzsAmount(Number(amount)),
          payment_url: paymentUrl,
        },
      }
    }

    return { data: { ...sessionData } }
  }

  async getWebhookActionAndData(
    _data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // Click uses server-to-server callbacks (Prepare/Complete) rather than webhooks here
    return { action: "not_supported" }
  }
}

/**
 * Click Pay-by-card provider (checkout.js widget).
 * We still rely on the same Click Prepare/Complete callbacks on the backend.
 */
export class ClickPayByCardProviderService extends ClickPaymentProviderService {
  static identifier = "click_pay_by_card"

  async initiatePayment(input: any): Promise<any> {
    const base = await super.initiatePayment(input)
    if (base?.data) {
      base.data.mode = "pay_by_card"
      // In pay-by-card flow we don't need payment_url, but we keep it as a fallback.
    }
    return base
  }
}




