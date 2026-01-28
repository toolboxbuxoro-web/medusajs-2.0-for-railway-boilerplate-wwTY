import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import OrderStatusBadge from "../order-overview/order-status-badge"
import { getOrderDisplayDate, formatOrderDateShort } from "@lib/util/date"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
  locale?: string
}

import { getTranslations } from 'next-intl/server'

const Overview = async ({ customer, orders, locale }: OverviewProps) => {
  const t = await getTranslations('account')

  return (
    <div data-testid="overview-page-wrapper" className="animate-fade-in">
      <div className="flex flex-col gap-y-8">
        <div className="pb-2 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('overview')}
          </h1>
        </div>


        {/* Recent Orders Section */}
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{t('recent_orders')}</h2>
            <LocalizedClientLink href="/account/orders" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
              {t('view_all_orders')}
            </LocalizedClientLink>
          </div>

          <div className="flex flex-col gap-y-3" data-testid="orders-wrapper">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <LocalizedClientLink
                  key={order.id}
                  href={`/account/orders/details/${order.id}`}
                  className="group block"
                >
                  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-red-200 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5" data-testid="order-wrapper" data-value={order.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
                         <div className="flex flex-col">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('order_placed')}</span>
                          <span className="font-medium text-gray-900" data-testid="order-created-date" data-value={order.created_at}>
                            {formatOrderDateShort(getOrderDisplayDate(order), (locale as any) || 'ru')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('order_number')}</span>
                          <span className="font-medium text-gray-900" data-testid="order-id" data-value={order.display_id}>
                            #{order.display_id}
                          </span>
                        </div>
                        <div className="flex flex-col col-span-2 sm:col-span-1 mt-2 sm:mt-0">
                          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('total_amount')}</span>
                          <span className="font-bold text-gray-900" data-testid="order-amount">
                            {convertToLocale({
                              amount: order.total,
                              currency_code: order.currency_code,
                              locale: locale
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-x-4">
                        <OrderStatusBadge order={order} />
                        <div className="p-2 rounded-full bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <ChevronDown className="-rotate-90 w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </LocalizedClientLink>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500" data-testid="no-orders-message">{t('no_recent_orders')}</p>
                <LocalizedClientLink href="/store" className="text-red-600 font-medium hover:underline mt-2 inline-block">
                  {t('start_shopping')}
                </LocalizedClientLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


export default Overview
