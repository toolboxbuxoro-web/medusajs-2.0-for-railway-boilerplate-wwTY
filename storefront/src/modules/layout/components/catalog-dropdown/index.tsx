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

// Category icons - Premium set
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
        className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100 shadow-sm group-hover:shadow transition-all"
      />
    )
  }
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="w-10 h-10 object-contain rounded-lg bg-gray-50 border border-gray-100 p-1.5 shadow-sm group-hover:shadow transition-all"
      />
    )
  }

  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-lg shadow-sm group-hover:shadow transition-all">
      {getCategoryIcon(category.handle || "")}
    </div>
  )
}

export default function CatalogDropdown({ categories, locale }: CatalogDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<HttpTypes.StoreProductCategory | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'main' | 'subcategories'>('main')
  const t = useTranslations('nav')

  // Check device size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024) // iPad Pro uses desktop view logic for touch, but layout shift is lg
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Set default active category for desktop
  useEffect(() => {
    if (isOpen && !isMobile && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0])
    }
  }, [isOpen, isMobile, categories, activeCategory])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      setActiveCategory(null)
      setMobileView('main')
    }, 200)
  }

  const handleMobileCategoryClick = (category: HttpTypes.StoreProductCategory) => {
    if (category.category_children && category.category_children.length > 0) {
      setActiveCategory(category)
      setMobileView('subcategories')
    } else {
      handleClose()
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-4 h-9 sm:h-10 lg:h-11 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] font-semibold text-xs sm:text-sm lg:text-base whitespace-nowrap select-none relative z-[101] ${
          isOpen 
            ? "bg-gray-900 text-white shadow-inner" 
            : "bg-red-600 text-white hover:bg-red-700 hover:shadow-md hover:scale-[1.02] active:scale-95"
        }`}
        aria-expanded={isOpen}
      >
        <span className={`transition-transform duration-300 ${isOpen ? "rotate-90 scale-0 opacity-0 absolute" : "scale-100 opacity-100"}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </span>
        <span className={`transition-transform duration-300 ${isOpen ? "scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"}`}>
          <XMark className="w-5 h-5" />
        </span>
        
        <span className="hidden md:inline">{t('catalog')}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 hidden md:block ${isOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} 
        />
      </button>

      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={handleClose}
        style={{ top: '0px' }} // Full screen overly
      />

      {/* Mega Menu Container - Positioned below header */}
      <div 
        className={`fixed left-0 right-0 bottom-0 z-[100] bg-white border-t border-gray-100 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] overflow-hidden ${
          isOpen 
            ? "translate-y-0 opacity-100 visible" 
            : "-translate-y-4 opacity-0 invisible pointer-events-none"
        }`}
        // Dynamic top position matching header height: 56px (mobile) -> 64px (sm) -> 72px (lg)
        style={{ top: 'var(--header-height, 0px)' }}
      >
        {/* CSS Variable for JS-less styling mostly, but utilizing tailwind classes for height below */}
        <div className="absolute inset-x-0 top-14 sm:top-16 lg:top-[72px] bottom-0 bg-white">
          
          {/* Main Layout Grid */}
          <div className="h-full flex flex-col lg:flex-row max-w-[1920px] mx-auto">
            
            {/* LEFT SIDEBAR (Desktop) / MAIN LIST (Mobile) */}
            <div className={`
              lg:w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col
              ${isMobile ? "w-full absolute inset-0 transition-transform duration-300" : ""}
              ${isMobile && mobileView === 'subcategories' ? "-translate-x-full" : "translate-x-0"}
            `}>
               {/* Mobile Header (Search/Close placeholder if needed, usually covered by main header) */}
               
               <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                  <LocalizedClientLink
                    href="/store"
                    className="flex items-center gap-3 px-6 py-4 hover:bg-white hover:text-red-600 transition-colors group border-b border-gray-100/50"
                    onClick={handleClose}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
                    <span className="font-semibold">{t('all_products')}</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-600" />
                  </LocalizedClientLink>

                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`
                        flex items-center justify-between px-6 py-3.5 cursor-pointer transition-all border-l-4
                        ${activeCategory?.id === category.id && !isMobile
                          ? 'bg-white border-red-600 text-red-600 shadow-sm' 
                          : 'border-transparent hover:bg-white hover:border-gray-200 text-gray-700'
                        }
                      `}
                      onMouseEnter={() => !isMobile && setActiveCategory(category)}
                      onClick={() => handleMobileCategoryClick(category)}
                    >
                      <div className="flex items-center gap-4">
                        <CategoryIcon category={category} />
                        <span className="font-medium">{getLocalizedCategoryName(category, locale)}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${activeCategory?.id === category.id && !isMobile ? "text-red-600 translate-x-1" : ""}`} />
                    </div>
                  ))}
               </div>
            </div>

            {/* RIGHT CONTENT (Desktop) / SUBCATEGORIES (Mobile) */}
            <div className={`
              flex-1 bg-white flex flex-col
              ${isMobile ? "w-full absolute inset-0 transition-transform duration-300 bg-gray-50" : ""}
              ${isMobile && mobileView === 'subcategories' ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            `}>
              {activeCategory ? (
                <>
                  {/* Mobile Back Header */}
                  {isMobile && (
                     <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm shrink-0">
                        <button 
                          onClick={() => setMobileView('main')}
                          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                        >
                           <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-bold text-lg truncate">{getLocalizedCategoryName(activeCategory, locale)}</span>
                     </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    {/* Desktop Category Header */}
                    {!isMobile && (
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                              {activeCategory.metadata?.image_url ? (
                                <img src={activeCategory.metadata.image_url as string} className="w-full h-full object-contain" alt="" />
                              ) : (
                                <span className="text-3xl">{getCategoryIcon(activeCategory.handle || "")}</span>
                              )}
                           </div>
                           <div>
                              <h2 className="text-3xl font-bold text-gray-900 mb-1">{getLocalizedCategoryName(activeCategory, locale)}</h2>
                              <LocalizedClientLink 
                                href={`/categories/${activeCategory.handle}`}
                                onClick={handleClose}
                                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1 group"
                              >
                                Перейти в раздел <span className="group-hover:translate-x-1 transition-transform">→</span>
                              </LocalizedClientLink>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Subcategories Grid */}
                    {activeCategory.category_children && activeCategory.category_children.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
                        {activeCategory.category_children.map((child) => (
                           <LocalizedClientLink
                              key={child.id}
                              href={`/categories/${child.handle}`}
                              onClick={handleClose}
                              className="group flex flex-col p-4 rounded-xl border border-gray-100 bg-white hover:border-red-100 hover:shadow-md transition-all duration-300"
                           >
                              <div className="flex items-start justify-between mb-3">
                                 <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                    {child.metadata?.icon_url ? (
                                      <img src={child.metadata.icon_url as string} className="w-6 h-6 object-contain" alt="" />
                                    ) : (
                                      getCategoryIcon(child.handle || "")
                                    )}
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                              </div>
                              <span className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors mb-1">
                                {getLocalizedCategoryName(child, locale)}
                              </span>
                              <span className="text-xs text-gray-500 line-clamp-2">
                                {child.metadata?.description_short as string || "Все товары категории"}
                              </span>
                           </LocalizedClientLink>
                        ))}
                      </div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                          <span className="text-6xl mb-4">📦</span>
                          <h3 className="text-xl font-semibold mb-2">В этой категории пока нет подкатегорий</h3>
                          <p className="text-gray-500">Но вы можете посмотреть все товары</p>
                          <LocalizedClientLink
                             href={`/categories/${activeCategory.handle}`}
                             onClick={handleClose}
                             className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                          >
                             Перейти к товарам
                          </LocalizedClientLink>
                       </div>
                    )}
                  </div>
                </>
              ) : (
                 <div className="hidden lg:flex h-full items-center justify-center text-gray-400">
                    Выберите категорию
                 </div>
              )}
            </div>

          </div>
        </div>

        {/* Close Button (Floating for desktop) */}
        {!isMobile && (
          <button
             onClick={handleClose}
             className="absolute top-20 right-8 p-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-red-600 hover:rotate-90 transition-all z-50"
             title="Закрыть меню"
          >
             <XMark className="w-6 h-6" />
          </button>
        )}
      </div>
    </>
  )
}
