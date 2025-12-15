import { Logger } from "@medusajs/framework/types"

type EskizTokenResponse = {
  data?: {
    token?: string
  }
  message?: string
}

let cachedToken: { token: string; fetchedAt: number } | null = null

function baseUrl(): string {
  return (process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz").replace(/\/$/, "")
}

function tokenIsFresh() {
  if (!cachedToken) return false
  // Eskiz tokens are typically long-lived; we refresh conservatively every 12h
  return Date.now() - cachedToken.fetchedAt < 12 * 60 * 60 * 1000
}

async function getToken(logger: Logger): Promise<string> {
  if (tokenIsFresh()) return cachedToken!.token

  const email = process.env.ESKIZ_EMAIL
  const password = process.env.ESKIZ_PASSWORD

  if (!email || !password) {
    throw new Error("Missing ESKIZ_EMAIL or ESKIZ_PASSWORD env vars")
  }

  // Eskiz Postman docs use multipart/form-data
  const form = new FormData()
  form.set("email", email)
  form.set("password", password)

  const resp = await fetch(`${baseUrl()}/api/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: form,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => "")
    logger.error(`[Eskiz] auth/login failed: ${resp.status} ${text}`)
    throw new Error(`Eskiz login failed (${resp.status})`)
  }

  const json = (await resp.json()) as EskizTokenResponse
  const token = json?.data?.token
  if (!token) {
    throw new Error("Eskiz login succeeded but token missing in response")
  }

  cachedToken = { token, fetchedAt: Date.now() }
  return token
}

export async function sendSms(logger: Logger, toPhone: string, message: string) {
  const from = process.env.ESKIZ_FROM
  if (!from) {
    throw new Error("Missing ESKIZ_FROM env var (sender)")
  }

  const token = await getToken(logger)

  // Eskiz Postman docs use multipart/form-data
  const form = new FormData()
  // Eskiz expects phone without +, usually 998XXXXXXXXX
  form.set("mobile_phone", toPhone)
  form.set("message", message)
  form.set("from", from)
  form.set("callback_url", process.env.ESKIZ_CALLBACK_URL || "")

  const resp = await fetch(`${baseUrl()}/api/message/sms/send`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  // If token expired, retry once
  if (resp.status === 401 || resp.status === 403) {
    cachedToken = null
    const token2 = await getToken(logger)
    const resp2 = await fetch(`${baseUrl()}/api/message/sms/send`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: form,
    })

    if (!resp2.ok) {
      const text = await resp2.text().catch(() => "")
      logger.error(`[Eskiz] sms/send failed: ${resp2.status} ${text}`)
      throw new Error(`Eskiz sms send failed (${resp2.status})`)
    }
    return
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "")
    logger.error(`[Eskiz] sms/send failed: ${resp.status} ${text}`)
    throw new Error(`Eskiz sms send failed (${resp.status})`)
  }
}


