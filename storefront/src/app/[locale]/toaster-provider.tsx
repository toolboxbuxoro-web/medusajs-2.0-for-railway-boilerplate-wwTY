"use client"

import { ToastProvider as CustomToastProvider } from "@lib/context/toast-context"

export default function ToasterProvider() {
  return <CustomToastProvider>{null}</CustomToastProvider>
}
