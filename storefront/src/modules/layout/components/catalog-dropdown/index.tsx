"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useTranslations } from 'next-intl'
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { ChevronDown, ChevronRight, XMark } from "@medusajs/icons"
import { getLocalizedCategoryName } from "@lib/util/get-localized-category-name"

type CatalogDropdownProps = {
  categories: HttpTypes.StoreProductCategory[]
  locale: string
}

// Category icons mapping - можно расширить
const categoryIcons: Record<string, string> = {
  "instrumenty": "🔧",
  "elektrika": "⚡",
  "santehnika": "🚿",
  "stroymaterialy": "🧱",
  "sad-ogorod": "🌿",
  "avto": "🚗",
  "bytovaya-tehnika": "🏠",
  "default": "📦"
}

const getCategoryIcon = (handle: string) => {
  return categoryIcons[handle] || categoryIcons.default
}

const CategoryIcon = ({ category }: { category: HttpTypes.StoreProductCategory }) => {
  const imageUrl = category.metadata?.image_url as string | undefined
  const iconUrl = category.metadata?.icon_url as string | undefined
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="w-5 h-5 object-cover rounded bg-gray-50 border border-gray-200"
      />
    )
  }
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="w-5 h-5 object-contain rounded bg-gray-50 border border-gray-200 p-0.5"
      />
    )
  }

  return <span className="text-lg">{getCategoryIcon(category.handle || "")}</span>
}

export default function CatalogDropdown({ categories, locale }: CatalogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<HttpTypes.StoreProductCategory | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'main' | 'subcategories'>('main')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('nav')

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Set first category as active when opening on desktop
  useEffect(() => {
    if (isOpen && !isMobile && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0])
    }
  }, [isOpen, isMobile, categories, activeCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setActiveCategory(null)
    setMobileView('main')
  }

  const handleCategoryClick = (category: HttpTypes.StoreProductCategory) => {
    if (isMobile) {
      if (category.category_children && category.category_children.length > 0) {
        setActiveCategory(category)
        setMobileView('subcategories')
      } else {
        // Navigate if no children
        handleClose()
      }
    }
  }

  const handleBackToMain = () => {
    setMobileView('main')
    setActiveCategory(null)
  }

  // Organize subcategories into columns (4 items per column max)
  const organizedSubcategories = useMemo(() => {
    if (!activeCategory?.category_children) return []
    const children = activeCategory.category_children
    const columns: HttpTypes.StoreProductCategory[][] = []
    const itemsPerColumn = 8
    
    for (let i = 0; i < children.length; i += itemsPerColumn) {
      columns.push(children.slice(i, i + itemsPerColumn))
    }
    
    return columns
  }, [activeCategory])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 h-10 md:h-12 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm md:text-base whitespace-nowrap"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isOpen ? (
          <XMark className="w-5 h-5" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
        <span className="hidden md:inline">{t('catalog')}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Desktop Megamenu */}
      {isOpen && !isMobile && (
        <div className="fixed left-0 right-0 top-[80px] z-50 bg-white shadow-2xl border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="content-container flex max-h-[calc(100vh-120px)]">
            {/* Left Sidebar - Categories */}
            <div className="w-64 lg:w-72 border-r border-gray-200 overflow-y-auto py-2 flex-shrink-0">
              {/* All Products Link */}
              <LocalizedClientLink
                href="/store"
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors group"
                onClick={handleClose}
              >
                <span className="text-lg">📦</span>
                <span className="font-semibold">{t('all_products')}</span>
              </LocalizedClientLink>

              <div className="my-2 border-t border-gray-200" />

              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    activeCategory?.id === category.id 
                      ? 'bg-red-50 text-red-600 border-r-2 border-red-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setActiveCategory(category)}
                  onClick={() => {
                    if (!category.category_children?.length) {
                      handleClose()
                    }
                  }}
                >
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="flex items-center gap-3 flex-1"
                    onClick={(e) => {
                      if (category.category_children?.length) {
                        e.preventDefault()
                      } else {
                        handleClose()
                      }
                    }}
                  >
                    <CategoryIcon category={category} />
                    <span className="text-sm lg:text-base">{getLocalizedCategoryName(category, locale)}</span>
                  </LocalizedClientLink>
                  {category.category_children && category.category_children.length > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Right Content - Subcategories */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
              {activeCategory && (
                <>
                  {/* Category Header */}
                  <div className="mb-6">
                    <LocalizedClientLink
                      href={`/categories/${activeCategory.handle}`}
                      className="inline-flex items-center gap-2 text-xl lg:text-2xl font-bold text-gray-900 hover:text-red-600 transition-colors"
                      onClick={handleClose}
                    >
                      {getLocalizedCategoryName(activeCategory, locale)}
                      <ChevronRight className="w-5 h-5" />
                    </LocalizedClientLink>
                  </div>

                  {/* Subcategories Grid */}
                  {activeCategory.category_children && activeCategory.category_children.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-2">
                      {activeCategory.category_children.map((subcategory) => (
                        <LocalizedClientLink
                          key={subcategory.id}
                          href={`/categories/${subcategory.handle}`}
                          className="py-2 text-sm lg:text-base text-gray-600 hover:text-red-600 transition-colors"
                          onClick={handleClose}
                        >
                          {getLocalizedCategoryName(subcategory, locale)}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <LocalizedClientLink
                        href={`/categories/${activeCategory.handle}`}
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
                        onClick={handleClose}
                      >
                        Смотреть все товары категории
                        <ChevronRight className="w-4 h-4" />
                      </LocalizedClientLink>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Закрыть"
            >
              <XMark className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 top-0 z-50 bg-white animate-in slide-in-from-left duration-200">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 bg-white sticky top-0">
            {mobileView === 'subcategories' ? (
              <button
                onClick={handleBackToMain}
                className="flex items-center gap-2 text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Назад</span>
              </button>
            ) : (
              <h2 className="text-lg font-semibold">{t('catalog')}</h2>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMark className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Content */}
          <div className="overflow-y-auto h-[calc(100vh-56px)]">
            {mobileView === 'main' ? (
              <div className="p-2">
                {/* All Products */}
                <LocalizedClientLink
                  href="/store"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={handleClose}
                >
                  <span className="text-lg">📦</span>
                  <span className="font-semibold">{t('all_products')}</span>
                </LocalizedClientLink>

                <div className="my-2 border-t border-gray-200" />

                {/* Categories */}
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category.category_children && category.category_children.length > 0 ? (
                      <>
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={category} />
                          <span className="text-base">{getLocalizedCategoryName(category, locale)}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </>
                    ) : (
                      <LocalizedClientLink
                        href={`/categories/${category.handle}`}
                        className="flex items-center gap-3 flex-1"
                        onClick={handleClose}
                      >
                        <CategoryIcon category={category} />
                        <span className="text-base">{getLocalizedCategoryName(category, locale)}</span>
                      </LocalizedClientLink>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Subcategories View */
              <div className="p-2">
                {activeCategory && (
                  <>
                    {/* Parent Category Link */}
                    <LocalizedClientLink
                      href={`/categories/${activeCategory.handle}`}
                      className="flex items-center gap-3 px-4 py-3 mb-2 bg-red-50 text-red-600 rounded-lg font-semibold"
                      onClick={handleClose}
                    >
                      <CategoryIcon category={activeCategory} />
                      <span>{getLocalizedCategoryName(activeCategory, locale)}</span>
                      <span className="ml-auto text-sm">Все →</span>
                    </LocalizedClientLink>

                    <div className="my-2 border-t border-gray-200" />

                    {/* Subcategories */}
                    {activeCategory.category_children?.map((subcategory) => (
                      <LocalizedClientLink
                        key={subcategory.id}
                        href={`/categories/${subcategory.handle}`}
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                        onClick={handleClose}
                      >
                        {getLocalizedCategoryName(subcategory, locale)}
                      </LocalizedClientLink>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
