import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Hardcoded popular queries for now as a fallback/P0
  const popular = [
    "Дрель",
    "Болгарка",
    "Шуруповерт",
    "Перфоратор",
    "Набор инструментов",
    "Сверла",
    "Ключи",
    "Генератор"
  ]

  res.json({ queries: popular })
}
