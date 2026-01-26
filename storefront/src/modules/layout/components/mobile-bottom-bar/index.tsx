"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Menu from "@modules/common/icons/menu"
import Cart from "@modules/common/icons/cart"
import Heart from "@modules/common/icons/heart"
import User from "@modules/common/icons/user"
import Search from "@modules/common/icons/search"
import { getLocalizedField } from "@lib/util/localization"
import { useFavorites } from "@lib/context/favorites-context"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"

type MobileBottomBarProps = {
  categories: HttpTypes.StoreProductCategory[]
  locale: string
}

// Иконка дома для главной страницы
const HomeIcon = ({ size = "24", color = "currentColor" }: { size?: string; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

// Компонент для корзины с счетчиком
function CartButtonMobile() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [hasItems, setHasItems] = useState(false)

  useEffect(() => {
    // Проверяем наличие корзины через cookie
    const checkCart = () => {
      const cookies = document.cookie.split(';')
      const cartCookie = cookies.find(c => c.trim().startsWith('_medusa_cart_id'))
      // Если есть cookie корзины, предполагаем что могут быть товары
      // Точное количество требует серверного запроса, поэтому показываем badge если есть корзина
      setHasItems(!!cartCookie)
    }

    checkCart()
    
    // Обновляем при изменении пути (после добавления в корзину)
    const interval = setInterval(checkCart, 1000)
    
    // Слушаем события обновления корзины
    const handleCartUpdate = () => {
      checkCart()
      // Также обновляем через небольшую задержку для надежности
      setTimeout(checkCart, 500)
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('focus', checkCart) // Обновляем при возврате на вкладку
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('focus', checkCart)
    }
  }, [pathname])

  const isActive = pathname === '/cart' || pathname?.startsWith('/cart')

  return (
    <LocalizedClientLink
      href="/cart"
      className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors relative ${
        isActive ? 'text-red-600' : 'text-gray-600'
      }`}
      title={t('cart')}
    >
      <Cart size="22" />
      {hasItems && (
        <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[8px] rounded-full w-2 h-2 flex items-center justify-center font-bold border-2 border-white">
        </span>
      )}
      <span className="text-[9px] font-medium leading-tight">{t('cart')}</span>
    </LocalizedClientLink>
  )
}

// Компонент для избранного с счетчиком
function FavoritesButtonMobile() {
  const { favorites } = useFavorites()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('nav')

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = pathname === '/favorites' || pathname?.startsWith('/favorites')
  const count = mounted ? favorites.length : 0

  return (
    <LocalizedClientLink
      href="/favorites"
      className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors relative ${
        isActive ? 'text-red-600' : 'text-gray-600'
      }`}
      title={t('favorites')}
    >
      <Heart size="22" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
      <span className="text-[9px] font-medium leading-tight">{t('favorites')}</span>
    </LocalizedClientLink>
  )
}

// Компонент каталога с выпадающим меню для мобильного bar
function CatalogButtonMobile({ categories, locale }: { categories: HttpTypes.StoreProductCategory[]; locale: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [isOpen, setIsOpen] = useState(false)

  const isActive = pathname?.startsWith('/store') || pathname?.startsWith('/categories')

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCategoryClick = (handle: string) => {
    if (handle) {
      router.push(`/categories/${handle}`)
      handleClose()
    }
  }

  return (
    <>
      {/* Кнопка каталога */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors relative ${
          isActive ? 'text-red-600' : 'text-gray-600'
        }`}
        title={t('catalog')}
      >
        <Menu size="22" />
        <span className="text-[9px] font-medium leading-tight">{t('catalog')}</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] md:hidden transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Модальное окно каталога */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[1001] bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh', top: 'auto' }}
      >
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{t('catalog')}</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Список категорий */}
          <div className="flex-1 overflow-y-auto p-4">
            <LocalizedClientLink
              href="/store"
              onClick={handleClose}
              className="flex items-center gap-3 p-3 mb-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <span className="text-2xl">📦</span>
              <span className="font-semibold">{t('all_products') || 'Все товары'}</span>
            </LocalizedClientLink>

            <div className="space-y-1">
              {categories.filter((c: any) => !c.is_internal).map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.handle || '')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xl">
                    {category.metadata?.icon_url || category.metadata?.image_url ? (
                      <span className="text-2xl">📦</span>
                    ) : (
                      <span className="text-2xl">
                        {category.handle === "instrumenty" ? "🔧" : 
                         category.handle === "elektrika" ? "⚡" : 
                         category.handle === "santehnika" ? "🚿" : 
                         category.handle === "stroymaterialy" ? "🧱" : "📦"}
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">
                    {getLocalizedField(category, "name", locale) || category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function MobileBottomBar({ categories, locale }: MobileBottomBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === `/${locale}`
    }
    if (path === '/store' || path === '/categories') {
      return pathname?.startsWith('/store') || pathname?.startsWith('/categories')
    }
    if (path === '/search') {
      return pathname === '/search' || pathname?.startsWith('/search')
    }
    return pathname === path || pathname?.startsWith(path)
  }

  const handleSearchClick = () => {
    router.push('/search')
  }

  return (
    <>
      {/* Нижний Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99] bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-1">
          {/* Главное */}
          <div className="flex-1 flex justify-center">
            <LocalizedClientLink
              href="/"
              className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors ${
                isActive('/') ? 'text-red-600' : 'text-gray-600'
              }`}
              title={t('home') || 'Главная'}
            >
              <HomeIcon size="22" color={isActive('/') ? '#DC2626' : '#4B5563'} />
              <span className="text-[9px] font-medium leading-tight">{t('home') || 'Главная'}</span>
            </LocalizedClientLink>
          </div>

          {/* Каталог с выпадающим меню */}
          <div className="flex-1 flex justify-center relative">
            <CatalogButtonMobile categories={categories} locale={locale} />
          </div>

          {/* Поиск */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={handleSearchClick}
              className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors ${
                isActive('/search') ? 'text-red-600' : 'text-gray-600'
              }`}
              title={t('search') || 'Поиск'}
            >
              <Search size="22" />
              <span className="text-[9px] font-medium leading-tight">{t('search') || 'Поиск'}</span>
            </button>
          </div>

          {/* Корзина */}
          <div className="flex-1 flex justify-center">
            <CartButtonMobile />
          </div>

          {/* Избранное */}
          <div className="flex-1 flex justify-center">
            <FavoritesButtonMobile />
          </div>

          {/* Профиль */}
          <div className="flex-1 flex justify-center">
            <LocalizedClientLink
              href="/account/orders"
              className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors ${
                isActive('/account') ? 'text-red-600' : 'text-gray-600'
              }`}
              title={t('account')}
            >
              <User size="22" />
              <span className="text-[9px] font-medium leading-tight">{t('account')}</span>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </>
  )
}
