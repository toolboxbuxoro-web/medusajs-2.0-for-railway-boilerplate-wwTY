import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

import { getTranslations } from 'next-intl/server'

const Overview = async ({ customer, orders }: OverviewProps) => {
  const t = await getTranslations('account')

  return (
    <div data-testid="overview-page-wrapper" className="animate-fade-in">
      <div className="flex flex-col gap-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1" data-testid="welcome-message" data-value={customer?.first_name}>
              {t('hello')}, {customer?.first_name}
            </h1>
            <p className="text-sm text-gray-500">
              {t('signed_in_as')} <span className="font-semibold text-gray-900" data-testid="customer-email" data-value={customer?.email}>{customer?.email}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Profile Completion Card */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex flex-col gap-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('profile_completion')}</h3>
              <div className="flex items-baseline gap-x-2">
                <span className="text-3xl sm:text-4xl font-bold text-red-600" data-testid="customer-profile-completion" data-value={getProfileCompletion(customer)}>
                  {getProfileCompletion(customer)}%
                </span>
                <span className="text-sm text-gray-500">{t('completed')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${getProfileCompletion(customer)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Addresses Card */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex flex-col gap-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('saved_addresses')}</h3>
              <div className="flex items-baseline gap-x-2">
                <span className="text-3xl sm:text-4xl font-bold text-red-600" data-testid="addresses-count" data-value={customer?.addresses?.length || 0}>
                  {customer?.addresses?.length || 0}
                </span>
                <span className="text-sm text-gray-500">{t('addresses')}</span>
              </div>
            </div>
          </div>
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
                          <span className="font-medium text-gray-900" data-testid="order-created-date">
                            {new Date(order.created_at).toLocaleDateString()}
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
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
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

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
