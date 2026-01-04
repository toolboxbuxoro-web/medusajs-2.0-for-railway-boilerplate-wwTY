import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Replace UZS currency code with localized currency symbol
 */
const replaceUZSSymbol = (formattedString: string, locale: string): string => {
  if (!formattedString.includes('UZS')) {
    return formattedString
  }
  
  // Determine the appropriate currency symbol based on locale
  const currencySymbol = locale.startsWith('uz') ? "so'm" : "сум"
  
  // Replace UZS with the localized symbol
  return formattedString.replace(/UZS/g, currencySymbol)
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "ru-RU",
}: ConvertToLocaleParams) => {
  // Handle NaN, null, or undefined amounts
  const safeAmount = (amount === null || amount === undefined || isNaN(amount)) ? 0 : amount
  
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

    const value = safeAmount / Math.pow(10, fractionDigits || 0)

    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency_code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
    
    // Replace UZS with localized currency symbol
    return replaceUZSSymbol(formatted, locale)
  }

  return safeAmount.toString()
}
