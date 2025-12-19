import Image from "next/image"
import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { getCategoriesList } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/common/icons/search"
import User from "@modules/common/icons/user"
import Menu from "@modules/common/icons/menu"
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from "@modules/common/components/language-switcher"
import MobileMenu from "@modules/layout/components/mobile-menu"
import CatalogDropdown from "@modules/layout/components/catalog-dropdown"
import ScrollAwareNav from "@modules/layout/components/scroll-aware-nav"
import FavoritesButton from "@modules/layout/components/favorites-button"
import { type Locale } from '../../../../i18n'
import { getLocalizedCategoryName } from "@lib/util/get-localized-category-name"

type NavProps = {
  locale: string
}

export default async function Nav({ locale }: NavProps) {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const { product_categories } = await getCategoriesList(0, 20)
  const mainCategories = product_categories?.filter(cat => !cat.parent_category) || []
  
  const t = await getTranslations({locale, namespace: 'nav'})

  return (
    <ScrollAwareNav>
      <div className="relative bg-white border-b border-gray-200">
        {/* Main Header - Fixed */}
        <header className="bg-white fixed w-full top-0 z-[100] border-b border-gray-200 shadow-sm transition-all duration-300 navbar-header">
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
                    src="/logo.svg"
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
                  src="/logo.svg"
                  alt={t("logo")}
                  width={100}
                  height={30}
                  className="w-[90px] h-auto object-contain"
                  priority
                />
              </LocalizedClientLink>
            </div>

            {/* Search Bar & Catalog - Hidden on mobile, visible on sm+ */}
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md md:max-w-xl lg:max-w-2xl navbar-search">
              <CatalogDropdown categories={mainCategories} locale={locale} />
              <form action="/search" method="get" className="relative flex-1">
                <input
                  type="search"
                  name="q"
                  placeholder={t('search_placeholder')}
                  className="w-full h-9 sm:h-10 lg:h-11 px-3 sm:px-4 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xs sm:text-sm lg:text-base transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-gray-500 hover:text-gray-700"
                >
                  <Search size="18" className="sm:w-5 sm:h-5" />
                </button>
              </form>
            </div>

            {/* Icons - Compact on mobile, right aligned */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 navbar-icons ml-auto sm:ml-0">
              {/* Search icon for mobile */}
              <LocalizedClientLink
                href="/search"
                className="sm:hidden p-1.5 hover:text-red-600 transition-colors"
                title={t('search_placeholder')}
              >
                <Search size="20" />
              </LocalizedClientLink>
              
              {/* Language Switcher - Hidden on mobile */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              
              {/* Favorites - Hidden on mobile */}
              <div className="hidden md:flex items-center justify-center">
                <FavoritesButton />
              </div>

              {/* Cart */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative"
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
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
              
              {/* Account */}
              <LocalizedClientLink
                href="/account"
                className="p-1.5 sm:p-2 hover:text-red-600 transition-colors flex items-center justify-center"
                title={t('account')}
              >
                <User size="20" className="sm:w-[22px] sm:h-[22px]" />
              </LocalizedClientLink>
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-14 sm:h-16 lg:h-[72px]"></div>

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

            {mainCategories.slice(0, 8).map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="px-1.5 lg:px-2.5 h-full flex items-center hover:text-red-600 transition-colors whitespace-nowrap text-xs lg:text-sm"
              >
                {getLocalizedCategoryName(category, locale)}
              </LocalizedClientLink>
            ))}
          </div>
        </nav>

        {/* Mobile Search Bar - Compact */}
        <div className="sm:hidden bg-white border-t border-gray-200 px-3 py-1.5 navbar-mobile-search">
          <form action="/search" method="get" className="relative">
            <input
              type="search"
              name="q"
              placeholder={t('search_placeholder')}
              className="w-full h-9 px-3 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            >
              <Search size="16" />
            </button>
          </form>
        </div>
      </div>
    </ScrollAwareNav>
  )
}
