"use client"

import React from "react"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const OrdersEmptyState: React.FC = () => {
  const t = useTranslations("account")

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
      data-testid="no-orders-container"
    >
      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {t("no_orders_title")}
      </h2>
      <p className="text-gray-500 text-center max-w-[300px] mb-8">
        {t("no_orders_message")}
      </p>
      <LocalizedClientLink
        href="/store"
        className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        data-testid="continue-shopping-button"
      >
        {t("continue_shopping")}
      </LocalizedClientLink>
    </div>
  )
}

export default OrdersEmptyState
