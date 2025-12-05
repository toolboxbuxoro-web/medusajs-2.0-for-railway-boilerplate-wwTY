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
  locale = "en-US",
}: ConvertToLocaleParams) => {
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
