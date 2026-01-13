"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@lib/context/auth-context"
import { useOrders } from "@lib/hooks/use-orders"
import OrdersSkeleton from "@modules/account/components/orders-skeleton"
import OrdersEmptyState from "@modules/account/components/orders-empty-state"
import OrdersErrorState from "@modules/account/components/orders-error-state"
import OrdersUnauthorizedState from "@modules/account/components/orders-unauthorized-state"
import OrderCard from "@modules/account/components/order-card"

const OrdersPage: React.FC = () => {
  const t = useTranslations("account")
  const { authStatus, hydrated } = useAuth()
  const { state, orders, retry, refresh, refreshing } = useOrders()

  const renderContent = () => {
    // While hydrating or auth is loading, show skeleton
    if (!hydrated || authStatus === "loading") {
      return <OrdersSkeleton />
    }

    // If unauthorized, show login CTA
    if (authStatus === "unauthorized") {
      return <OrdersUnauthorizedState />
    }

    // State machine for orders
    switch (state) {
      case "loading":
        return <OrdersSkeleton />
      case "empty":
        return <OrdersEmptyState />
      case "error":
        return <OrdersErrorState onRetry={retry} />
      case "loaded":
        return (
          <div className="flex flex-col gap-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )
    }
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-6 flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t("orders")}</h1>
          <button
            onClick={refresh}
            disabled={refreshing || state === "loading"}
            className="flex items-center gap-x-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-all p-2 rounded-lg hover:bg-red-50"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? t("loading") : "Обновить"}</span>
          </button>
        </div>
        <p className="text-gray-500">{t("orders_description")}</p>
      </div>
      {renderContent()}
    </div>
  )
}

export default OrdersPage
