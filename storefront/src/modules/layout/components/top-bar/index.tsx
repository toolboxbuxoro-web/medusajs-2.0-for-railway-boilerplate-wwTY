"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Phone } from "@medusajs/icons"
import PickupPointSelector from "@modules/layout/components/pickup-point-selector"

export default function TopBar() {
  const t = useTranslations('nav')
  const params = useParams()
  const locale = params.locale as string
  const [isAtTop, setIsAtTop] = useState(true)
  
  useEffect(() => {
    const handleScroll = () => {
      const atTop = window.scrollY < 10
      const isMobile = window.innerWidth < 768
      setIsAtTop(atTop)
      // On mobile, always 0. On desktop, depends on scroll
      document.documentElement.style.setProperty('--topbar-height', isMobile ? '0px' : (atTop ? '36px' : '0px'))
    }
    
    // Set initial value based on screen size
    const isMobile = window.innerWidth < 768
    document.documentElement.style.setProperty('--topbar-height', isMobile ? '0px' : '36px')
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])
  
  return (
    <div className={`bg-gray-900 text-white text-sm transition-all duration-200 overflow-hidden ${
      isAtTop ? 'h-9 opacity-100' : 'h-0 opacity-0'
    }`}>
      <div className="content-container flex items-center justify-between h-9">
        {/* Left side - Pickup point selector */}
        <div className="flex items-center gap-6">
          <PickupPointSelector locale={locale} variant="desktop" />
        </div>
        
        {/* Center - Links */}
        <div className="flex items-center gap-6">
          <LocalizedClientLink 
            href="/delivery" 
            className="hover:text-red-400 transition-colors"
          >
            {t('delivery') || 'Доставка'}
          </LocalizedClientLink>
          <LocalizedClientLink 
            href="/customer-service" 
            className="hover:text-red-400 transition-colors"
          >
            {t('support') || 'Поддержка'}
          </LocalizedClientLink>
          <LocalizedClientLink 
            href="/about" 
            className="hover:text-red-400 transition-colors"
          >
            {t('about') || 'О компании'}
          </LocalizedClientLink>
        </div>
        
        {/* Right side - Phone */}
        <div className="flex items-center gap-2 mr-2">
          <a 
            href="tel:+998880811112" 
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-semibold"
          >
            <Phone className="w-4 h-4" />
            <span>+998 88 081-11-12</span>
          </a>
        </div>
      </div>
    </div>
  )
}
