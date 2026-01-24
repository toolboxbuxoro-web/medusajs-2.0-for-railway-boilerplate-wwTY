import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"

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
  return (
    <>
      <Nav locale={params.locale} />
      {children}
      <Footer />
    </>
  )
}
