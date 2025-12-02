import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from "@modules/checkout/components/language-switcher"

export default async function CheckoutLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: "checkout" })
  const tNav = await getTranslations({ locale, namespace: "nav" })
  
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white border-b border-gray-200">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-gray-700 flex items-center gap-x-2 uppercase flex-1 basis-0 hover:text-gray-900 transition-colors"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus">
              {t('back_to_cart')}
            </span>
            <span className="mt-px block small:hidden txt-compact-plus">
              {t('back')}
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-gray-900 hover:text-red-600 uppercase font-bold tracking-wide transition-colors"
            data-testid="store-link"
          >
            {tNav('logo')}
          </LocalizedClientLink>
          <div className="flex-1 basis-0 flex justify-end">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}
