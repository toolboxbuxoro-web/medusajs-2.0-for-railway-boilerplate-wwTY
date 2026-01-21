import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate({
  params,
}: {
  params: { locale: string }
}) {
  const { locale } = params
  const customer = await getCustomer().catch(() => null)
  const orders = (await listOrders(50, 0).catch(() => null)) || null

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} locale={locale} />
}
