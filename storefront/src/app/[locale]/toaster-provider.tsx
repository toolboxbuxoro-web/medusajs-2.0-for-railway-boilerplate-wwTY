"use client"

import { ToastProvider as CustomToastProvider } from "@lib/context/toast-context"

export default function ToasterProvider({ children }: { children: React.ReactNode }) {
  return <CustomToastProvider>{children}</CustomToastProvider>
}
