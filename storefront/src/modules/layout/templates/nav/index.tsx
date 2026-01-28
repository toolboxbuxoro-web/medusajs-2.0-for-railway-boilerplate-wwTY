import Image from "next/image"

import { listRegions } from "@lib/data/regions"
import { getCategoriesList } from "@lib/data/categories"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Menu from "@modules/common/icons/menu"
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from "@modules/common/components/language-switcher"
import MobileMenu from "@modules/layout/components/mobile-menu"
import CatalogDropdown from "@modules/layout/components/catalog-dropdown"
import ScrollAwareNav from "@modules/layout/components/scroll-aware-nav"
import FavoritesButton from "@modules/layout/components/favorites-button"
import CartButton from "@modules/layout/components/cart-button"
import ProfileButton from "@modules/layout/components/profile-button"
import Headset from "@modules/common/icons/headset"
import Phone from "@modules/common/icons/phone"
import PickupPointSelector from "@modules/layout/components/pickup-point-selector"
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
          className="bg-white fixed w-full z-[100] border-b border-gray-200 shadow-sm md:transition-all md:duration-200 navbar-header top-0 md:top-[var(--topbar-height,36px)]"
        >
          <div className="flex flex-col w-full">
            <div className="content-container flex items-center justify-between h-14 sm:h-16 lg:h-18 gap-1 sm:gap-3 lg:gap-6 transition-[height] duration-300 navbar-header-content relative px-2 sm:px-0">
            {/* Left section: Mobile Menu + Logo (desktop) */}
            <div className="flex items-center gap-1 sm:gap-3 sm:flex-shrink-0 flex-1 sm:flex-none min-w-0">
              {/* Mobile Menu Button - Desktop only */}
              <div className="hidden sm:block">
                <MobileMenu categories={mainCategories} locale={locale} />
              </div>
              
              {/* Pickup Point Selector - Mobile only (left) */}
              <div className="sm:hidden flex-shrink-0 z-20 relative">
                <PickupPointSelector locale={locale} />
              </div>
              
              {/* Logo - Desktop only (left aligned) */}
              <div className="hidden sm:flex items-center flex-shrink-0">
                <LocalizedClientLink
                  href="/"
                  className="flex items-center"
                  data-testid="nav-store-link"
                >
                  <Image
                    src="/toolbox-logo.png"
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
            <div className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <LocalizedClientLink
                href="/"
                className="flex items-center pointer-events-auto"
                data-testid="nav-store-link-mobile"
              >
                <Image
                  src="/toolbox-logo.png"
                  alt={t("logo")}
                  width={140}
                  height={42}
                  className="w-[100px] xs:w-[110px] sm:w-[120px] h-auto object-contain"
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
              {/* Mobile Language Switcher (left of phone) */}
              <div className="sm:hidden mr-2">
                <LanguageSwitcher variant="mobile" />
              </div>

              {/* Phone Button - Mobile only (right) */}
              <a
                href="tel:+998880811112"
                className="sm:hidden px-3 py-2 mr-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                title={t('call') || "Позвонить"}
              >
                <Phone size="20" />
              </a>

              {/* Language Switcher - Hidden on mobile */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              
              {/* Favorites, Cart, Profile - PC version only */}
              <div className="hidden md:flex items-center justify-center gap-1 md:gap-2">
                <FavoritesButton label={t('favorites')} />
                <CartButton />
                <ProfileButton label={t('account')} />
              </div>
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
                {/* ТОЛЬКО icon_url для навигации сверху */}
                {category.metadata?.icon_url ? (
                  <div className="relative w-5 h-5 lg:w-6 lg:h-6 shrink-0">
                    <Image
                      src={category.metadata.icon_url as string}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-contain"
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
