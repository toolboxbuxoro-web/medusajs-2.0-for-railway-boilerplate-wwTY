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
          <div className="content-container flex items-center justify-between h-16 md:h-20 gap-3 md:gap-6 transition-all duration-300 navbar-header-content">
            {/* Mobile Menu Button */}
            <MobileMenu categories={mainCategories} locale={locale} />

            {/* Logo */}
          <div className="flex items-center">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2"
              data-testid="nav-store-link"
            >
              <Image
                src="/logo.svg"
                alt={t("logo")}
                width={120}
                height={40}
                className="block object-contain"
              />
            </LocalizedClientLink>
          </div>

            {/* Search Bar & Catalog - Hidden on small mobile, visible on tablet+ */}
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xl lg:max-w-2xl navbar-search">
              <CatalogDropdown categories={mainCategories} locale={locale} />
              <form action="/search" method="get" className="relative flex-1">
                <input
                  type="search"
                  name="q"
                  placeholder={t('search_placeholder')}
                  className="w-full h-10 md:h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                >
                  <Search size="20" />
                </button>
              </form>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 md:gap-3 navbar-icons">
              {/* Search icon for mobile */}
              <LocalizedClientLink
                href="/search"
                className="sm:hidden p-2 hover:text-red-600 transition-colors"
                title={t('search_placeholder')}
              >
                <Search size="22" />
              </LocalizedClientLink>
              
              {/* Language Switcher */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
              
              {/* Favorites */}
              <div className="hidden md:block">
                <FavoritesButton />
              </div>

              {/* Cart */}
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="p-2 hover:text-red-600 transition-colors relative"
                    href="/cart"
                    data-testid="nav-cart-link"
                    title={t('cart')}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
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
                className="p-2 hover:text-red-600 transition-colors"
                title={t('account')}
              >
                <User size="22" />
              </LocalizedClientLink>
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-16 md:h-20"></div>

        {/* Navigation Bar - Categories */}
        <nav className="hidden md:block bg-white border-t border-gray-200 navbar-categories transition-all duration-300">
          <div className="content-container flex items-center gap-2 lg:gap-4 h-12 lg:h-14 overflow-x-auto no-scrollbar">
            <LocalizedClientLink
              href="/store"
              className="flex items-center gap-2 px-3 lg:px-4 h-full bg-red-600 text-white hover:bg-red-700 transition-colors whitespace-nowrap text-sm lg:text-base font-semibold"
            >
              <Menu size="18" />
              <span>{t('all_products') || 'Все товары'}</span>
            </LocalizedClientLink>

            {mainCategories.slice(0, 8).map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="px-2 lg:px-3 h-full flex items-center hover:text-red-600 transition-colors whitespace-nowrap text-sm lg:text-base"
              >
                {getLocalizedCategoryName(category, locale)}
              </LocalizedClientLink>
            ))}
          </div>
        </nav>

        {/* Mobile Search Bar */}
        <div className="sm:hidden bg-white border-t border-gray-200 px-4 py-2 navbar-mobile-search">
          <form action="/search" method="get" className="relative">
            <input
              type="search"
              name="q"
              placeholder={t('search_placeholder')}
              className="w-full h-10 px-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700"
            >
              <Search size="18" />
            </button>
          </form>
        </div>
      </div>
    </ScrollAwareNav>
  )
}
