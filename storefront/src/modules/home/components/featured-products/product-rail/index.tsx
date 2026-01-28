import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getLocalizedField } from "@lib/util/localization"
import ProductSlider from "./ProductSlider"

export default function ProductRail({
  collection,
  region,
  locale,
  isFirst = false,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  locale: string
  isFirst?: boolean
}) {
  const { products } = collection as HttpTypes.StoreCollection & { products: HttpTypes.StoreProduct[] }
  const metadata = (collection.metadata || {}) as Record<string, any>

  if (!products || products.length === 0) {
    return null
  }

  const totalCount = products.length
  const collectionTitle = getLocalizedField(collection, "title", locale) || collection.title

  // Extract custom styles from metadata
  const bgColor = metadata.bg_color as string | undefined
  const bgImage = metadata.bg_image as string | undefined
  const textColor = metadata.text_color as string | undefined
  const theme = metadata.theme as string | undefined



  // Determine if it should have any special background
  // Custom bg ONLY if color/image explicitly set OR theme is explicitly 'winter'
  const hasCustomBg = !!(bgColor || bgImage || theme === 'winter')
  const isWinterTheme = theme === 'winter'

  // Computed styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    backgroundImage: bgImage ? `url(${bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  const content = (
    <div 
      className={`relative ${hasCustomBg ? 'isolate py-5 px-4 sm:px-8 rounded-[2.5rem] overflow-hidden' : 'mb-3 sm:mb-5'}`}
      style={hasCustomBg ? containerStyle : undefined}
    >
      {isWinterTheme && (
        <>
          {/* Deep Blue Winter Background Overlay (only if no custom bg color/image) */}
          {!bgColor && !bgImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0059b3] via-[#004a99] to-[#003366] -z-10" />
          )}
          
          {/* Diagonal Light Streak */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/10 to-transparent skew-y-12 scale-150 pointer-events-none -z-10" />

          {/* Large Background Snowflakes */}
          <div className="absolute -top-10 -right-10 text-white/10 pointer-events-none rotate-12">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,2V6.08L16.5,4.06L17.5,5.8L14,7.82V11H17.18L19.2,7.5L20.94,8.5L18.92,12L20.94,15.5L19.2,16.5L17.18,13H14V16.18L17.5,18.2L16.5,19.94L13,17.92V22h-2V17.92l-3.5,2.02l-1-1.74l3.5-2.02V13H6.82l-2.02,3.5l-1.74-1l2.02-3.5l-2.02-3.5l1.74-1l2.02,3.5H10V7.82L6.5,5.8L7.5,4.06L11,6.08V2H13z" />
            </svg>
          </div>
          <div className="absolute -bottom-20 -left-10 text-white/5 pointer-events-none -rotate-12">
            <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,2V6.08L16.5,4.06L17.5,5.8L14,7.82V11H17.18L19.2,7.5L20.94,8.5L18.92,12L20.94,15.5L19.2,16.5L17.18,13H14V16.18L17.5,18.2L16.5,19.94L13,17.92V22h-2V17.92l-3.5,2.02l-1-1.74l3.5-2.02V13H6.82l-2.02,3.5l-1.74-1l2.02-3.5l-2.02-3.5l1.74-1l2.02,3.5H10V7.82L6.5,5.8L7.5,4.06L11,6.08V2H13z" />
            </svg>
          </div>

          {/* Snow Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
             {[...Array(20)].map((_, i) => (
               <div 
                 key={i}
                 className="absolute rounded-full bg-white animate-pulse"
                 style={{
                   width: Math.random() * 4 + 1 + 'px',
                   height: Math.random() * 4 + 1 + 'px',
                   top: Math.random() * 100 + '%',
                   left: Math.random() * 100 + '%',
                   opacity: Math.random() * 0.5 + 0.2,
                   animationDelay: Math.random() * 5 + 's',
                   animationDuration: Math.random() * 3 + 2 + 's'
                 }}
               />
             ))}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 
          className={`text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 ${hasCustomBg ? 'drop-shadow-md' : 'text-gray-900'}`}
          style={{ color: textColor || (hasCustomBg ? 'white' : undefined) }}
        >
          {collectionTitle}
          {isWinterTheme && <span className="animate-bounce">❄️</span>}
        </h2>
        
        {/* Right side: View all link + count + arrows */}
        <div className="flex items-center gap-3">
          <LocalizedClientLink 
            href={`/collections/${collection.handle}`}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              hasCustomBg 
              ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20' 
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={{ color: textColor || (hasCustomBg ? 'white' : undefined) }}
          >
            <span>{locale === 'ru' ? 'Смотреть все' : 'Barchasini ko\'rish'}</span>
            <span className={hasCustomBg ? 'opacity-60' : 'text-gray-400'}>({totalCount})</span>
          </LocalizedClientLink>
          
          <div className="flex items-center gap-1.5">
            <button 
              data-slider-prev={collection.id}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
                hasCustomBg 
                ? 'bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ color: textColor || (hasCustomBg ? 'white' : undefined) }}
              aria-label="Предыдущий"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              data-slider-next={collection.id}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
                hasCustomBg 
                ? 'bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ color: textColor || (hasCustomBg ? 'white' : undefined) }}
              aria-label="Следующий"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Products Slider */}
      <ProductSlider products={products} totalCount={totalCount} collectionId={collection.id} />

      {/* Mobile-only View All Button Below Slider */}
      <div className="flex justify-center mt-6 sm:hidden">
        <LocalizedClientLink 
          href={`/collections/${collection.handle}`}
          className={`inline-flex items-center justify-center px-6 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
            hasCustomBg
            ? 'bg-white hover:bg-gray-50'
            : 'border border-red-600 text-red-600 hover:bg-red-50'
          }`}
          style={{ color: hasCustomBg ? '#004a99' : textColor }}
        >
          <span>{locale === 'ru' ? 'Смотреть все' : 'Barchasini ko\'rish'}</span>
          <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </LocalizedClientLink>
      </div>
    </div>
  )

  return hasCustomBg ? (
    <div className="mb-3 sm:mb-5">
      {content}
    </div>
  ) : content
}
