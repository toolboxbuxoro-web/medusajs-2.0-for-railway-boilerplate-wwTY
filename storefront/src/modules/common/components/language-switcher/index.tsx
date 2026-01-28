"use client"

import { usePathname, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import { locales, type Locale } from '../../../../i18n'

const languages: Record<Locale, { name: string; short: string }> = {
  ru: { name: 'Русский', short: 'RU' },
  uz: { name: 'O\'zbekcha', short: 'UZ' },
}

interface LanguageSwitcherProps {
  variant?: 'default' | 'mobile'
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const params = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentLocale = useLocale() as Locale

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const switchLanguage = (locale: Locale) => {
    if (locale === currentLocale) {
      setIsOpen(false)
      return
    }

    // URL structure: /[locale]/[countryCode]/...
    const pathParts = pathname.split('/').filter(Boolean)
    
    // Get countryCode from params (should be second segment after locale)
    const countryCode = params.countryCode as string
    
    // Build new path
    let newPath = ''
    
    if (pathParts.length > 0 && locales.includes(pathParts[0] as Locale)) {
      // Current path has locale as first segment
      if (countryCode && pathParts.length > 1) {
        // Has countryCode: /[locale]/[countryCode]/rest...
        // Replace locale, keep countryCode and rest
        const restPath = pathParts.slice(2).join('/')
        newPath = `/${locale}/${countryCode}${restPath ? '/' + restPath : ''}`
      } else {
        // No countryCode: /[locale]/rest...
        const restPath = pathParts.slice(1).join('/')
        newPath = `/${locale}${restPath ? '/' + restPath : ''}`
      }
    } else {
      // No locale in path (shouldn't happen, but handle it)
      newPath = `/${locale}${pathname}`
    }
    
    // Preserve query string
    const searchParams = window.location.search
    const fullUrl = searchParams ? `${newPath}${searchParams}` : newPath
    
    setIsOpen(false)
    
    // Force full page reload to ensure server-side locale change and new translations
    window.location.href = fullUrl
  }

  const isMobile = variant === 'mobile'

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 transition-colors ${
          isMobile 
            ? 'px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-semibold text-gray-700' 
            : 'px-3 py-2 text-sm hover:text-red-600'
        }`}
      >
        <span>
          {isMobile ? languages[currentLocale]?.short : languages[currentLocale]?.name}
        </span>
        <svg 
          className={`transition-transform ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute z-[100] bg-white border border-gray-200 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
          isMobile ? 'right-0 bottom-full mb-1 w-32' : 'right-0 mt-2 w-48'
        }`}>
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => switchLanguage(locale)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                locale === currentLocale ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              <span>{isMobile ? languages[locale].name : languages[locale].name}</span>
              {locale === currentLocale && (
                <svg className="w-4 h-4 ml-auto text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
