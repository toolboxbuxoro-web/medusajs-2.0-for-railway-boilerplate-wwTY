import { formatOrderDateShort } from "./date"

export const formatRating = (rating: number): string => {
  return (rating || 0).toFixed(1)
}

export const formatReviewDate = (date: string | Date, locale: string): string => {
  return formatOrderDateShort(date, (locale as any) || "ru")
}
