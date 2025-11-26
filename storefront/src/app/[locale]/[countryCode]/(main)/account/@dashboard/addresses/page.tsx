import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from 'next-intl/server'

import AddressBook from "@modules/account/components/address-book"

import { headers } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses({
  params,
}: {
  params: { countryCode: string }
}) {
  const { countryCode } = params
  const customer = await getCustomer()
  const region = await getRegion(countryCode)
  const t = await getTranslations('account')

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{t('shipping_addresses')}</h1>
        <p className="text-base-regular">
          {t('addresses_description')}
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
