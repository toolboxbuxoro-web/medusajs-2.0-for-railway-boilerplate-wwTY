"use client"

import { useTranslations } from "next-intl"

export default function SearchFallback({ query }: { query: string }) {
  const t = useTranslations("search")
  
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-8 py-6">
      <div className="flex flex-col gap-y-2">
        <h2 className="text-lg font-bold text-gray-800">
           По запросу «<span className="text-red-600">{query}</span>» ничего не найдено
        </h2>
        <p className="text-gray-500 text-sm">
           Показываем похожие и популярные товары
        </p>
      </div>
    </div>
  )
}
