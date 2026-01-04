"use client"

import { usePathname, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { locales, type Locale } from '../../../../i18n'

const languages: Record<Locale, { name: string; flag: string }> = {
  ru: { name: 'Русский', flag: '🇷🇺' },
  uz: { name: 'O\'zbekcha', flag: '🇺🇿' },
}

export default function MobileLanguageSwitcher() {
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = useLocale() as Locale

  const switchLanguage = (locale: Locale) => {
    if (locale === currentLocale) return

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
    
    // Force full page reload to ensure server-side locale change and new translations
    window.location.href = fullUrl
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLanguage(locale)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
            locale === currentLocale 
              ? 'bg-red-600 text-white font-semibold shadow-sm' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="text-base">{languages[locale].flag}</span>
          <span className="text-sm">{languages[locale].name}</span>
        </button>
      ))}
    </div>
  )
}
