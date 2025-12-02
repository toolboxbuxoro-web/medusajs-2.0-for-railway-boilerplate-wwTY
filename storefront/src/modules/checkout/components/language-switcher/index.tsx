"use client"

import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

const LANGUAGES = [
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'ru', name: 'RU', flag: '🇷🇺' },
  { code: 'uz', name: 'UZ', flag: '🇺🇿' },
]

export default function LanguageSwitcher() {
  const params = useParams()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLocale = params.locale as string
  const currentLanguage = LANGUAGES.find(lang => lang.code === currentLocale) || LANGUAGES[0]
  
  // Get the path without locale
  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="font-medium text-sm uppercase">{currentLanguage.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {LANGUAGES.map((language) => (
              <LocalizedClientLink
                key={language.code}
                href={pathWithoutLocale || '/'}
                locale={language.code}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  currentLocale === language.code ? 'bg-gray-50 text-red-600 font-semibold' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {currentLocale === language.code && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </LocalizedClientLink>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
