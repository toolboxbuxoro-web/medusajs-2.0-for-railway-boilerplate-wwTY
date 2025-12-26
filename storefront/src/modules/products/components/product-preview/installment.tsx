import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

// Форматирует цену: убирает тийины (.00, ,00, или " 00") и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  let smoothPrice = priceString.replace(/[.,]00(?=\s|$)/, "")
  smoothPrice = smoothPrice.replace(/\s00(?=\s[A-Z]|$)/, "")
  return smoothPrice.replace(/,/g, " ")
}

export default function InstallmentPrice({ 
  amount,
  currency_code
}: { 
  amount: number
  currency_code: string
}) {
  const monthlyAmount = Math.round(amount / 12)
  const formattedMonthly = formatPrice(convertToLocale({ 
    amount: monthlyAmount, 
    currency_code: currency_code 
  }))

  return (
    <div className="bg-orange-50 text-orange-700 text-[11px] sm:text-xs font-semibold px-2 py-1 rounded inline-block mb-3">
       от {formattedMonthly} / мес
    </div>
  )
}
