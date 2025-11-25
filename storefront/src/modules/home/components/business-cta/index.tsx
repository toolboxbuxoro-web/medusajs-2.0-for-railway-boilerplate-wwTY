import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Briefcase from "@modules/common/icons/briefcase"
import { getTranslations } from 'next-intl/server'

export default async function BusinessCta() {
  const t = await getTranslations('home')

  const benefits = [
    t('business_benefit_1') || "Wholesale discount system",
    t('business_benefit_2') || "VAT refund",
    t('business_benefit_3') || "Deferred payment",
    t('business_benefit_4') || "Personal manager",
    t('business_benefit_5') || "Personal account for legal entities",
    t('business_benefit_6') || "Electronic document management",
  ]

  return (
    <div className="bg-gray-800 text-white section-padding">
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h2 className="heading-2 mb-4 sm:mb-6">
              {t('business_title') || 'Buy as a legal entity'}
            </h2>
            
            {/* Mobile: Horizontal scroll badges */}
            <div className="lg:hidden -mx-4 px-4 mb-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 flex items-center gap-2 bg-white/10 rounded-full px-3 py-2 text-sm"
                  >
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="whitespace-nowrap">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: List */}
            <ul className="hidden lg:block space-y-3 lg:space-y-4 mb-6 lg:mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm lg:text-base">{benefit}</span>
                </li>
              ))}
            </ul>

            <LocalizedClientLink
              href="/business"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold text-sm sm:text-base w-full sm:w-auto"
            >
              <Briefcase size="18" />
              {t('business_cta') || 'Learn More'}
            </LocalizedClientLink>
          </div>

          {/* Visual */}
          <div className="hidden sm:flex items-center justify-center order-first lg:order-last">
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Briefcase size="60" color="#ffffff" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-500/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
