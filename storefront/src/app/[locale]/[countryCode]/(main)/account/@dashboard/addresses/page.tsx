import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from 'next-intl/server'


import { headers } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await getCustomer()
  const region = await getRegion(countryCode)
  const t = await getTranslations('account')

  if (!customer || !region) {
    return null
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{t('shipping_addresses')}</h1>
        <p className="text-base-regular">
          {t('addresses_description')}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-4 text-gray-800">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{t('bts_delivery_title')}</h3>
              <p className="text-gray-600">
                {t('bts_delivery_desc')}
              </p>
            </div>
        </div>
      </div>
    </div>
  )
}
