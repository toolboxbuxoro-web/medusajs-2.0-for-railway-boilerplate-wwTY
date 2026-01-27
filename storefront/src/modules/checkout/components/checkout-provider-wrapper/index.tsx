"use client"

import { CheckoutProvider } from "@lib/context/checkout-context"
import { ReactNode } from "react"

export default function CheckoutProviderWrapper({ children }: { children: ReactNode }) {
  return <CheckoutProvider>{children}</CheckoutProvider>
}
