import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslations } from 'next-intl'

const EmptyCartMessage = () => {
  const t = useTranslations('cart')
  
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[50vh] animate-fade-in" data-testid="empty-cart-message">
      {/* Icon Container */}
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          className="text-gray-400"
        >
          <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 12H5L3 6z" />
          <circle cx="7" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
        </svg>
      </div>

      {/* Text Content */}
      <h1 className="heading-2 mb-3 text-gray-900">
        {t('your_cart')}
      </h1>
      
      <p className="text-base-regular text-gray-500 max-w-md mb-8">
        {t('empty_cart')}
      </p>

      {/* Action Button */}
      <LocalizedClientLink 
        href="/store" 
        className="btn-primary inline-flex items-center gap-2 shadow-md hover:shadow-lg transform transition-all duration-200 hover:-translate-y-0.5"
      >
        <span>{t('start_shopping')}</span>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
