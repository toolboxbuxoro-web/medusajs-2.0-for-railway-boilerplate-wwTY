"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from 'next-intl'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "@medusajs/icons"

type CatalogDropdownProps = {
  categories: HttpTypes.StoreProductCategory[]
}

export default function CatalogDropdown({ categories }: CatalogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('nav')

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 h-10 md:h-12 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm md:text-base whitespace-nowrap"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="hidden md:inline">{t('catalog')}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-2">
            {/* All Products Link */}
            <LocalizedClientLink
              href="/store"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="font-semibold">{t('all_products')}</span>
            </LocalizedClientLink>

            <div className="my-2 border-t border-gray-200"></div>

            {/* Categories */}
            {categories.map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 hover:text-red-600 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-sm md:text-base">{category.name}</span>
                {category.category_children && category.category_children.length > 0 && (
                  <span className="text-xs text-gray-400 group-hover:text-red-600">
                    {category.category_children.length}
                  </span>
                )}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
