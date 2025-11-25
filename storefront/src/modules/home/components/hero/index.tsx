import { getTranslations } from 'next-intl/server'
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = async () => {
  const t = await getTranslations('hero')
  
  return (
    <div className="w-full relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="content-container relative py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
          {/* Left: Text Content */}
          <div className="text-white z-10 text-center lg:text-left">
            <div className="inline-block px-2.5 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-xs font-medium mb-3">
              🔥 {t('promo_badge') || 'Black Friday Sale'}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
              {t('brand')}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 max-w-lg mx-auto lg:mx-0">
              {t('tagline')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center lg:justify-start">
              <LocalizedClientLink 
                href="/store"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5"
              >
                {t('shop_now')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </LocalizedClientLink>
              <LocalizedClientLink 
                href="/about"
                className="btn-secondary inline-flex items-center justify-center text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5"
              >
                {t('learn_more')}
              </LocalizedClientLink>
            </div>

            {/* Trust badges - mobile friendly */}
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('free_shipping') || 'Free Shipping'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('warranty') || '2 Year Warranty'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('original') || '100% Original'}</span>
              </div>
            </div>
          </div>

          {/* Right: Visual Element */}
          <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 flex items-center justify-center order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-500/10 transform -skew-x-12 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-blue-600/10 to-transparent transform skew-x-12 rounded-3xl"></div>
            <div className="relative z-10 text-center">
              <div className="text-white/10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter select-none">
                {t('tools')}
              </div>
              {/* Floating elements for visual interest */}
              <div className="absolute -top-2 -right-2 w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  )
}

export default Hero
