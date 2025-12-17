import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "ru-RU",
}: ConvertToLocaleParams) => {
  // #region agent log
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    const payload = {
      sessionId: "debug-session",
      runId: "bts-checkout",
      hypothesisId: "H1_shipping_amount_is_undefined_or_nan",
      location: "storefront/src/lib/util/money.ts:convertToLocale",
      message: "convertToLocale received non-finite amount",
      data: {
        amount,
        amountType: typeof amount,
        currency_code,
        locale,
      },
      timestamp: Date.now(),
    }
    console.log("[agent-debug]", JSON.stringify(payload))
    fetch("http://127.0.0.1:7242/ingest/0a4ffe82-b28a-4833-a3aa-579b3fd64808", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }
  // #endregion agent log

  if (currency_code && !isEmpty(currency_code)) {
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency_code,
    })

    // Get the default fraction digits for the currency to convert cents to units
    // Medusa stores amounts in the smallest currency unit (e.g., cents)
    const { maximumFractionDigits: defaultFractionDigits } =
      formatter.resolvedOptions()

    // Special case for UZS to treat as 0 decimals since we store main units
    const fractionDigits = currency_code.toUpperCase() === 'UZS' ? 0 : defaultFractionDigits

    const value = amount / Math.pow(10, fractionDigits || 0)

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency_code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
  }

  return amount.toString()
}
