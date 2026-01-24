import { Metadata } from "next"
import { getTranslations } from 'next-intl/server'

import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileName from "@modules/account/components/profile-name"

import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Medusa Store profile.",
}

export default async function Profile() {
  const customer = await getCustomer()
  const regions = await listRegions()
  const t = await getTranslations('account')

  if (!customer || !regions) {
    return null
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">{t('profile')}</h1>
        <p className="text-base-regular">
          {t('profile_description')}
        </p>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-gray-200" />
}
