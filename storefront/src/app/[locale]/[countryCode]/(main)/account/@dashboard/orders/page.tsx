import { Metadata } from "next"
import OrdersPage from "@modules/account/components/orders-page"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default function Orders() {
  return <OrdersPage />
}

