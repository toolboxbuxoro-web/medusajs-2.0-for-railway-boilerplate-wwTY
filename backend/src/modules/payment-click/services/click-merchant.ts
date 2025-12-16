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
      click_trans_id: input.click_trans_id,
      merchant_trans_id: input.merchant_trans_id,
      merchant_prepare_id: input.merchant_prepare_id,
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
      click_trans_id: input.click_trans_id,
      merchant_trans_id: input.merchant_trans_id,
      merchant_confirm_id: input.merchant_confirm_id,
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
      },
    })

    return this.buildPrepareResponse({
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id,
      error: ClickErrorCodes.SUCCESS,
      error_note: "Success",
    })
  }

  async handleComplete(body: Partial<ClickCompleteRequest>) {
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
    if (!session) {
      return this.buildCompleteResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: "0",
        error: ClickErrorCodes.USER_DOES_NOT_EXIST,
        error_note: "User does not exist",
      })
    }

    if (!this.validateAmountMatchesSession(amount, session.amount)) {
      return this.buildCompleteResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: "0",
        error: ClickErrorCodes.INCORRECT_AMOUNT,
        error_note: "Incorrect parameter amount",
      })
    }

    const currentData = this.parseSessionData(session.data)

    // Validate merchant_prepare_id against what we stored at Prepare
    if (currentData.merchant_prepare_id && String(currentData.merchant_prepare_id) !== merchant_prepare_id) {
      return this.buildCompleteResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: "0",
        error: ClickErrorCodes.TRANSACTION_DOES_NOT_EXIST,
        error_note: "Transaction does not exist",
      })
    }

    // Idempotency: if already completed and no error, return success
    if (currentData.click_state === "completed" && currentData.click_error === 0) {
      return this.buildCompleteResponse({
        click_trans_id,
        merchant_trans_id,
        merchant_confirm_id: merchant_prepare_id,
        error: ClickErrorCodes.SUCCESS,
        error_note: "Success",
      })
    }

    const paymentModule = this.container_.resolve(Modules.PAYMENT)

    // Update session data first
    const nextState =
      clickError === 0 ? "completed" : clickError === ClickErrorCodes.TRANSACTION_CANCELLED ? "cancelled" : "error"

    await paymentModule.updatePaymentSession({
      id: session.id,
      amount: Number(session.amount),
      currency_code: session.currency_code || "uzs",
      data: {
        ...currentData,
        click_state: nextState,
        click_trans_id,
        click_paydoc_id,
        merchant_prepare_id,
        click_error: clickError,
        click_error_note: error_note_in || (clickError === 0 ? "Success" : "Error"),
        sign_time,
        transaction_id: click_paydoc_id || click_trans_id,
      },
    })

    // On success, complete cart to create order
    if (clickError === 0) {
      const cartId = currentData.cart_id || session.cart_id
      if (cartId && !session.completed_at) {
        try {
          await completeCartWorkflow(this.container_).run({
            input: { id: cartId },
          })
          this.logger_.info(
            `[ClickMerchant] Completed cart ${cartId} for click_trans_id=${click_trans_id}`
          )
        } catch (e) {
          this.logger_.error(
            `[ClickMerchant] Failed to complete cart ${cartId}: ${e}`
          )
          // Still return success to Click to avoid desync
        }
      }
    }

    return this.buildCompleteResponse({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: merchant_prepare_id,
      error: clickError,
      error_note: error_note_in || (clickError === 0 ? "Success" : "Error"),
    })
  }
}


