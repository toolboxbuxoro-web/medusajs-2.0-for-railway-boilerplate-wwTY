import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'

type InjectedDependencies = {
  logger: Logger
}

interface EskizServiceConfig {
  email: string
  password: string
  from: string
}

export interface EskizNotificationServiceOptions {
  email: string
  password: string
  from: string
}

type EskizTokenResponse = {
  data?: {
    token?: string
  }
  message?: string
}

/**
 * Service to handle SMS notifications using the Eskiz.uz API.
 */
export class EskizNotificationService extends AbstractNotificationProviderService {
  static identifier = "ESKIZ_NOTIFICATION_SERVICE"
  protected config_: EskizServiceConfig
  protected logger_: Logger
  protected cachedToken: { token: string; fetchedAt: number } | null = null
  protected baseUrl: string = "https://notify.eskiz.uz"

  constructor({ logger }: InjectedDependencies, options: EskizNotificationServiceOptions) {
    super()
    this.config_ = {
      email: options.email,
      password: options.password,
      from: options.from
    }
    this.logger_ = logger
  }

  private tokenIsFresh() {
    if (!this.cachedToken) return false
    // Eskiz tokens are typically long-lived; we refresh conservatively every 12h
    return Date.now() - this.cachedToken.fetchedAt < 12 * 60 * 60 * 1000
  }

  private async getToken(): Promise<string> {
    if (this.tokenIsFresh()) return this.cachedToken!.token

    if (!this.config_.email || !this.config_.password) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing ESKIZ_EMAIL or ESKIZ_PASSWORD")
    }

    const form = new FormData()
    form.set("email", this.config_.email)
    form.set("password", this.config_.password)

    const resp = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: form,
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => "")
      this.logger_.error(`[Eskiz] auth/login failed: ${resp.status} ${text}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Eskiz login failed (${resp.status})`)
    }

    const json = (await resp.json()) as EskizTokenResponse
    const token = json?.data?.token
    if (!token) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Eskiz login succeeded but token missing in response")
    }

    this.cachedToken = { token, fetchedAt: Date.now() }
    return token
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `No notification information provided`)
    }

    // We only support SMS channel
    if (notification.channel !== 'sms') {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Channel ${notification.channel} not supported by Eskiz`)
    }

    const token = await this.getToken()
    const toPhone = notification.to
    // If we have a generic message in data, use it, otherwise use what's provided
    const message = (notification.data?.message as string) || (notification.data?.text as string) || ""

    if (!toPhone || !message) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing phone number or message content")
    }

    const form = new FormData()
    form.set("mobile_phone", toPhone.replace(/\+/g, "")) // Eskiz expects phone without +
    form.set("message", message)
    form.set("from", this.config_.from)

    const sendRequest = async (authToken: string) => {
      return fetch(`${this.baseUrl}/api/message/sms/send`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: form,
      })
    }

    let resp = await sendRequest(token)

    // If token expired, retry once
    if (resp.status === 401 || resp.status === 403) {
      this.cachedToken = null
      const newToken = await this.getToken()
      resp = await sendRequest(newToken)
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "")
      this.logger_.error(`[Eskiz] sms/send failed: ${resp.status} ${text}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Eskiz sms send failed (${resp.status})`)
    }

    this.logger_.info(`Successfully sent SMS to ${toPhone} via Eskiz`)
    return {}
  }
}
