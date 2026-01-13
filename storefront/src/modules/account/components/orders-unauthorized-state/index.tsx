"use client"

import React from "react"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const OrdersUnauthorizedState: React.FC = () => {
  const t = useTranslations("account")

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Войдите в аккаунт
      </h2>
      <p className="text-gray-500 text-center max-w-[300px] mb-8">
        Чтобы просмотреть историю заказов, необходимо авторизоваться.
      </p>
      <LocalizedClientLink
        href="/account"
        className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        {t("sign_in")}
      </LocalizedClientLink>
    </div>
  )
}

export default OrdersUnauthorizedState
