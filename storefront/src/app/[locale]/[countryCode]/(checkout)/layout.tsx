import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from "@modules/checkout/components/language-switcher"

export default async function CheckoutLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const params = await props.params
  const { children } = props
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "checkout" })
  
  return (
    <div className="w-full bg-gray-50/50 min-h-screen">
      <header className="h-20 bg-white border-b border-gray-100 flex items-center sticky top-0 z-50">
        <div className="content-container flex items-center justify-between w-full">
          <LocalizedClientLink
            href="/"
            className="text-2xl font-bold text-gray-900 tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-2"
          >
             <span className="bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">Toolbox</span>
          </LocalizedClientLink>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <LocalizedClientLink
                href="/cart"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
                {t('back_to_cart')}
            </LocalizedClientLink>
          </div>
        </div>
      </header>
      <main className="relative" data-testid="checkout-container">
        <div className="content-container py-12">
            {children}
        </div>
      </main>
    </div>
  )
}
