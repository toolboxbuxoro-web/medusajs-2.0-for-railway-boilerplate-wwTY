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


        {/* Navigation Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LocalizedClientLink 
            href="/delivery" 
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-red-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
              {t('delivery') || 'Доставка и оплата'}
            </span>
          </LocalizedClientLink>

          <LocalizedClientLink 
            href="/customer-service" 
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-red-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
              {t('customer_service') || 'Поддержка'}
            </span>
          </LocalizedClientLink>

          <LocalizedClientLink 
            href="/about" 
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-red-200 transition-all duration-200 group"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-600 mb-3 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
              {t('about_us') || 'О компании'}
            </span>
          </LocalizedClientLink>
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
