"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from 'next-intl'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Cart from "@modules/common/icons/cart"
import Heart from "@modules/common/icons/heart"
import User from "@modules/common/icons/user"
import Menu from "@modules/common/icons/menu"
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

export default function MobileBottomBar({ categories, locale }: MobileBottomBarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === `/${locale}`
    }
    if (path === '/store' || path === '/categories') {
      return pathname?.startsWith('/store') || pathname?.startsWith('/categories')
    }
    return pathname === path || pathname?.startsWith(path)
  }

  const catalogIsActive = pathname?.startsWith('/store') || pathname?.startsWith('/categories')

  return (
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

        {/* Каталог - открывает страницу /categories */}
        <div className="flex-1 flex justify-center">
          <LocalizedClientLink
            href="/categories"
            className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors ${
              catalogIsActive ? 'text-red-600' : 'text-gray-600'
            }`}
            title={t('catalog')}
          >
            <Menu size="22" />
            <span className="text-[9px] font-medium leading-tight">{t('catalog')}</span>
          </LocalizedClientLink>
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
  )
}
