import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code?: string | null
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Formats a money amount with localized currency symbols.
 * 1:1 migration from Mobile.
 * 
 * @param amount - The amount to format (in major units, e.g., 1250000)
 * @param locale - The locale to use for formatting ('ru' or 'uz')
 * @returns Formatted string (e.g., "1 250 000 сум" or "1 250 000 so'm")
 */
export function formatMoney(amount: number, locale: 'ru' | 'uz' = 'ru'): string {
  if (amount === undefined || amount === null) return '0'

  // Use ru-RU to get space separators
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(amount)
  
  // Replace narrow non-breaking space with regular space
  const cleanFormatted = formatted.replace(/\s/g, ' ')
  
  return locale === 'uz' ? `${cleanFormatted} so'm` : `${cleanFormatted} сум`
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "ru",
}: ConvertToLocaleParams) => {
  const safeAmount = (amount === null || amount === undefined || isNaN(amount)) ? 0 : amount
  
  // Medusa stores amounts in subunits.
  // We need to determine how many decimals the currency has.
  const code = currency_code ? currency_code.toUpperCase() : 'UZS'
  const isUZS = code === 'UZS'
  
  // For UZS we traditionally treat as 0 decimals in this project's subunit storage
  const fractionDigits = isUZS ? 0 : 2
  const value = safeAmount / Math.pow(10, fractionDigits)

  if (isUZS) {
    const l = locale.startsWith('uz') ? 'uz' : 'ru'
    return formatMoney(value, l)
  }

  // Fallback for non-UZS currencies
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
    style: "currency",
    currency: code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}
