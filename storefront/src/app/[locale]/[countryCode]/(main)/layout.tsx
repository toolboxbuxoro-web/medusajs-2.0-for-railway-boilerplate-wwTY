import { Metadata } from "next"

import Nav from "@modules/layout/templates/nav"
import MobileBottomBar from "@modules/layout/components/mobile-bottom-bar"
import { getBaseURL } from "@lib/util/env"
import { getCategoriesList } from "@lib/data/categories"
import { HttpTypes } from "@medusajs/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string; countryCode: string }>
}

export default async function PageLayout(props: Props) {
  const { children } = props
  const params = await props.params
  const { product_categories } = await getCategoriesList(0, 100)
  const mainCategories = product_categories?.filter((cat: HttpTypes.StoreProductCategory) => !cat.parent_category) || []
  
  return (
    <>
      <Nav locale={params.locale} />
      <div className="md:pb-0 pb-20">
        {children}
      </div>
      <MobileBottomBar categories={mainCategories} locale={params.locale} />
    </>
  )
}
