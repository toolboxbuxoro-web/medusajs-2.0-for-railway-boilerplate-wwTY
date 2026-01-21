import Image from "next/image"
import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { getCategoriesList } from "@lib/data/categories"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import User from "@modules/common/icons/user"
import Menu from "@modules/common/icons/menu"
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from "@modules/common/components/language-switcher"
import MobileMenu from "@modules/layout/components/mobile-menu"
import CatalogDropdown from "@modules/layout/components/catalog-dropdown"
import ScrollAwareNav from "@modules/layout/components/scroll-aware-nav"
import FavoritesButton from "@modules/layout/components/favorites-button"
import Headset from "@modules/common/icons/headset"
import { type Locale } from '../../../../i18n'
import { getLocalizedField } from "@lib/util/localization"
import TopBar from "@modules/layout/components/top-bar"
import { DesktopSearch, MobileSearch, CompactSearch } from "@modules/layout/components/nav-search"

type NavProps = {
  locale: string
}

export default async function Nav({ locale }: NavProps) {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const { product_categories } = await getCategoriesList(0, 100)
  const mainCategories = product_categories?.filter((cat: HttpTypes.StoreProductCategory) => !cat.parent_category) || []
  
  const t = await getTranslations({locale, namespace: 'nav'})


  return (
    <ScrollAwareNav>
      <div className="relative bg-white border-b border-gray-200">
        {/* Top Info Bar - Fixed at very top */}
        <div className="hidden md:block fixed w-full top-0 z-[102]">
          <TopBar />
        </div>
        
        {/* Main Header - Fixed, position controlled by CSS variable */}
        <header 
          className="bg-white fixed w-full z-[100] border-b border-gray-200 shadow-sm transition-all duration-200 navbar-header top-0 md:top-[var(--topbar-height,36px)]"
        >
          <div className="flex flex-col w-full">
            <div className="content-container flex items-center justify-between h-14 sm:h-16 lg:h-18 gap-2 sm:gap-3 lg:gap-6 transition-all duration-300 navbar-header-content relative">
            {/* Left section: Mobile Menu + Logo (desktop) */}
            <div className="flex items-center gap-2 sm:gap-3 sm:flex-shrink-0">
              {/* Mobile Menu Button */}
              <MobileMenu categories={mainCategories} locale={locale} />
              
              {/* Logo - Desktop only (left aligned) */}
              <div className="hidden sm:flex items-center flex-shrink-0">
                <LocalizedClientLink
                  href="/"
                  className="flex items-center"
                  data-testid="nav-store-link"
                >
                  <Image
                    src="/toolbox-logo.png?v=3"
                    alt={t("logo")}
                    width={140}
                    height={42}
                    className="w-[90px] md:w-[110px] lg:w-[140px] h-auto object-contain"
                    priority
                  />
                </LocalizedClientLink>
              </div>
            </div>

            {/* Logo - Mobile only (centered) */}
            <div className="sm:hidden absolute left-1/2 -translate-x-1/2 z-10">
              <LocalizedClientLink
                href="/"
                className="flex items-center"
                data-testid="nav-store-link-mobile"
              >
                <Image
                  src="/toolbox-logo.png?v=3"
                  alt={t("logo")}
                  width={100}
                  height={30}
                  className="w-[90px] h-auto object-contain"
                  priority
                />
              </LocalizedClientLink>
            </div>

            {/* Search Bar with Catalog - Separated design */}
            <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md md:max-w-xl lg:max-w-2xl navbar-search">
              {/* Catalog Button - Standalone */}
              <CatalogDropdown categories={mainCategories} locale={locale} isUnified={false} />
              
              {/* Search Input - Separate with red border */}
              <DesktopSearch placeholder={t('search_placeholder')} />
            </div>

            {/* Icons - Compact on mobile, right aligned */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 navbar-icons ml-auto sm:ml-0">
              {/* Delivery Link - Desktop */}


              {/* Search icon for mobile - REMOVED since we have full bar */}
              
              {/* Language Switcher - Hidden on mobile */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              
              {/* Favorites - Hidden on mobile */}
              <div className="hidden md:flex items-center justify-center">
                <FavoritesButton label={t('favorites')} />
              </div>

              {/* Cart */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center sm:flex-col sm:gap-1"
                    href="/cart"
                    data-testid="nav-cart-link"
                    title={t('cart')}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="sm:w-[22px] sm:h-[22px]"
                    >
                      <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 12H5L3 6z" />
                      <circle cx="7" cy="20" r="1" />
                      <circle cx="17" cy="20" r="1" />
                    </svg>
                    <span className="text-[10px] font-medium hidden sm:block">{t('cart')}</span>
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
              
              {/* Account */}
              <LocalizedClientLink
                href="/account/orders"
                className="p-1.5 sm:p-2 hover:text-red-600 transition-colors flex items-center justify-center sm:flex-col sm:gap-1"
                title={t('account')}
              >
                <User size="20" className="sm:w-[22px] sm:h-[22px]" />
                <span className="text-[10px] font-medium hidden sm:block">{t('account')}</span>
              </LocalizedClientLink>
            </div>
          </div>
          
          {/* Mobile Search Bar - Fixed inside header */}
          <div className="sm:hidden w-full px-4 pb-3 bg-white">
            <MobileSearch placeholder={t('search_placeholder')} />
          </div>
          </div>
        </header>

        {/* Spacer for fixed header + TopBar */}
        <div className="h-14 sm:h-16 md:h-[100px] lg:h-[108px]"></div>

        {/* Navigation Bar - Categories (Desktop/Tablet only) */}
        <nav className="hidden md:block bg-white border-t border-gray-200 navbar-categories transition-all duration-300">
          <div className="content-container flex items-center gap-1.5 lg:gap-3 h-10 lg:h-12 overflow-x-auto no-scrollbar">
            <LocalizedClientLink
              href="/store"
              className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 h-full bg-red-600 text-white hover:bg-red-700 transition-colors whitespace-nowrap text-xs lg:text-sm font-semibold rounded-sm"
            >
              <Menu size="16" className="lg:w-[18px] lg:h-[18px]" />
              <span>{t('all_products') || 'Все товары'}</span>
            </LocalizedClientLink>

            {mainCategories.slice(0, 10).map((category: HttpTypes.StoreProductCategory) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group px-1.5 lg:px-3 h-full flex items-center gap-1.5 lg:gap-2 hover:text-red-600 transition-colors whitespace-nowrap text-[11px] lg:text-sm font-medium"
              >
                {category.metadata?.icon_url ? (
                  <div className="relative w-5 h-5 lg:w-6 lg:h-6 shrink-0">
                    <Image
                      src={category.metadata.icon_url as string}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                ) : category.metadata?.image_url ? (
                  <div className="relative w-5 h-5 lg:w-6 lg:h-6 shrink-0 rounded overflow-hidden">
                    <Image
                      src={category.metadata.image_url as string}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-base lg:text-lg xl:text-xl">
                    {category.handle === "instrumenty" ? "🔧" : 
                     category.handle === "elektrika" ? "⚡" : 
                     category.handle === "santehnika" ? "🚿" : 
                     category.handle === "stroymaterialy" ? "🧱" : "📦"}
                  </span>
                )}
                <span>{getLocalizedField(category, "name", locale) || category.name}</span>
              </LocalizedClientLink>
            ))}
          </div>
        </nav>

        {/* Mobile Search Bar - Compact */}
        <div className="sm:hidden bg-white border-t border-gray-200 px-3 py-1.5 navbar-mobile-search">
          <CompactSearch placeholder={t('search_placeholder')} />
        </div>
      </div>
    </ScrollAwareNav>
  )
}
