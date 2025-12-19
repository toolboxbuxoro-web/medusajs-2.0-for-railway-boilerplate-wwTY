"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useFormState } from "react-dom"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import { useTranslations } from 'next-intl'

const Addresses = ({
  cart,
  customer,
  shippingMethods = [],
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  shippingMethods?: HttpTypes.StoreCartShippingOption[]
}) => {
  const t = useTranslations('checkout')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useFormState(setAddresses, null)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4 px-2">
        <Heading level="h2" className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {!isOpen && cart?.shipping_address && (
                <CheckCircleSolid className="text-green-500" />
            )}
            {t('shipping_information')}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors flex items-center gap-1 group"
            data-testid="edit-address-button"
          >
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {t('edit')}
          </button>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-4">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              availableShippingMethods={shippingMethods}
            />

            {!sameAsBilling && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <Heading
                  level="h2"
                  className="text-xl font-bold text-gray-900 mb-6"
                >
                  {t('billing_address')}
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton className="mt-8 w-full h-12 rounded-xl text-base font-bold shadow-lg" data-testid="submit-address-button">
              {t('continue')}
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
                  {/* Shipping & Contact info */}
                  <div className="space-y-4">
                    <div data-testid="shipping-address-summary">
                        <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                        {t('recipient')}
                        </Text>
                        <Text className="text-base font-semibold text-gray-900 leading-tight">
                        {cart.shipping_address.first_name}{" "}
                        {cart.shipping_address.last_name}
                        </Text>
                        <Text className="text-sm text-gray-600 font-medium">
                        {cart.shipping_address.phone}
                        </Text>
                    </div>

                    <div data-testid="shipping-contact-summary">
                         <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                        {t('contact_email')}
                        </Text>
                        <Text className="text-sm text-gray-600 font-medium break-all">
                        {cart.email}
                        </Text>
                    </div>
                  </div>

                  {/* Delivery Location / BTS */}
                  <div className="space-y-4">
                    {cart.metadata?.bts_delivery ? (
                        <div>
                             <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                                {t('bts_delivery_point')}
                             </Text>
                             <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <Text className="text-sm font-bold text-gray-900">
                                        {(cart.metadata.bts_delivery as any).region}
                                    </Text>
                                </div>
                                <Text className="text-xs text-gray-500 font-medium line-clamp-2">
                                    {(cart.metadata.bts_delivery as any).point}
                                </Text>
                             </div>
                        </div>
                    ) : (
                        <div data-testid="billing-address-summary">
                         <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                           {t('shipping_address')}
                         </Text>
                         <Text className="text-sm text-gray-600 font-medium leading-relaxed">
                           {cart.shipping_address.address_1}
                           {cart.shipping_address.address_2 && `, ${cart.shipping_address.address_2}`}
                           <br />
                           {cart.shipping_address.city}, {cart.shipping_address.country_code?.toUpperCase()}
                         </Text>
                       </div>
                    )}

                    {/* Billing info */}
                    <div className="pt-4 border-t border-gray-100">
                         {sameAsBilling ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircleSolid />
                                <Text className="text-xs font-bold uppercase tracking-wide">
                                    {t('billing_same_as_shipping')}
                                </Text>
                            </div>
                            ) : (
                            <div>
                                <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">
                                    {t('billing_address')}
                                </Text>
                                <Text className="text-xs text-gray-600 truncate">
                                    {cart.billing_address?.address_1}
                                </Text>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Addresses
