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
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    // Функция для получения количества товаров в корзине
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart/count')
        if (response.ok) {
          const data = await response.json()
          setItemCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching cart count:', error)
        setItemCount(0)
      }
    }

    fetchCartCount()
    
    // Обновляем при изменении пути (после добавления в корзину)
    const interval = setInterval(fetchCartCount, 2000)
    
    // Слушаем события обновления корзины
    const handleCartUpdate = () => {
      fetchCartCount()
      // Также обновляем через небольшую задержку для надежности
      setTimeout(fetchCartCount, 500)
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('focus', fetchCartCount) // Обновляем при возврате на вкладку
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('focus', fetchCartCount)
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
      {itemCount > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
          {itemCount > 99 ? '99+' : itemCount}
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

// Smart Home Button с двойным нажатием и запоминанием позиции
function SmartHomeButton({ isActive, label }: { isActive: boolean; label: string }) {
  const pathname = usePathname()
  const [lastTap, setLastTap] = useState(0)
  
  useEffect(() => {
    // Сохраняем позицию скролла главной страницы перед уходом
    const saveScrollPosition = () => {
      if (pathname === '/' || pathname?.match(/^\/[a-z]{2}$/)) {
        const scrollPos = window.scrollY
        localStorage.setItem('homeScrollPosition', scrollPos.toString())
      }
    }
    
    // Сохраняем при скролле (с debounce)
    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(saveScrollPosition, 200)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', saveScrollPosition)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', saveScrollPosition)
    }
  }, [pathname])
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const currentTime = Date.now()
    const isDoubleTap = currentTime - lastTap < 300 // 300ms для двойного клика
    
    const isOnHomePage = pathname === '/' || pathname?.match(/^\/[a-z]{2}$/)
    
    if (isOnHomePage) {
      if (isDoubleTap) {
        // Двойной клик - скролл наверх
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Одинарный клик на главной - ничего не делаем или скролл наверх
        // (можно настроить поведение)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      // Не на главной - переходим на главную
      const savedPosition = localStorage.getItem('homeScrollPosition')
      
      // Переходим на главную
      window.location.href = '/'
      
      // После загрузки восстанавливаем позицию
      if (savedPosition && !isDoubleTap) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedPosition), behavior: 'auto' })
        }, 100)
      }
    }
    
    setLastTap(currentTime)
  }
  
  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-0.5 p-1.5 transition-colors ${
        isActive ? 'text-red-600' : 'text-gray-600'
      }`}
      title={label}
    >
      <HomeIcon size="22" color={isActive ? '#DC2626' : '#4B5563'} />
      <span className="text-[9px] font-medium leading-tight">{label}</span>
    </button>
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[101] bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 px-1">
        {/* Главное - Smart scroll button */}
        <div className="flex-1 flex justify-center">
          <SmartHomeButton isActive={isActive('/')} label={t('home') || 'Главная'} />
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
