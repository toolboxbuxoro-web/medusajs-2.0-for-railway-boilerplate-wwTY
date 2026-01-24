import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { generateAlternates } from "@lib/util/seo"

export async function generateMetadata(props: { params: Promise<{ locale: string; countryCode: string }> }): Promise<Metadata> {
  const params = await props.params
  const { locale, countryCode } = params
  const t = await getTranslations({ locale, namespace: "about_page" })
  return {
    title: `${t("hero.title")} | Toolbox`,
    description: t("hero.subtitle"),
    alternates: generateAlternates(countryCode, "/about", locale),
  }
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "about_page" })

  const timelineSteps = [
    { year: t("timeline.steps.start.year"), text: t("timeline.steps.start.text") },
    { year: t("timeline.steps.growth.year"), text: t("timeline.steps.growth.text") },
    { year: t("timeline.steps.today.year"), text: t("timeline.steps.today.text") },
  ]

  return (
    <div className="bg-white min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-gray-50 py-16 md:py-24 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            {t("hero.subtitle")}
          </p>
          
          {/* Trust Bullets */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {[
              { label: t("hero.bullets.years"), icon: "📅" },
              { label: t("hero.bullets.branches"), icon: "📍" },
              { label: t("hero.bullets.service"), icon: "🛠️" }
            ].map((bullet, i) => (
              <div key={i} className="flex items-center justify-center gap-3 px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                <span className="text-xl">{bullet.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{bullet.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. VISUAL TIMELINE */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            {t("timeline.title")}
          </h2>

          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className="text-4xl font-black text-red-600 mb-2">
                  {step.year}
                </div>
                <div className="w-3 h-3 rounded-full bg-red-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm md:text-base">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHAT TOOLBOX IS TODAY */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            {t("today.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left: Text */}
            <div className="space-y-4 text-gray-600 text-base md:text-lg leading-relaxed">
              <p>{t("today.p1")}</p>
              <p>{t("today.p2")}</p>
              <p>{t("today.p3")}</p>
            </div>

            {/* Right: Info Cards */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { title: t("today.cards.catalog.title"), text: t("today.cards.catalog.text"), icon: "📦" },
                { title: t("today.cards.service.title"), text: t("today.cards.service.text"), icon: "✅" },
                { title: t("today.cards.pickup.title"), text: t("today.cards.pickup.text"), icon: "📍" }
              ].map((card, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{card.title}</h4>
                    <p className="text-sm text-gray-500">{card.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. LOCAL PRESENCE */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center text-white">
             <div className="inline-block bg-red-600 text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-6">
               {t("presence.city")}
             </div>
             <h2 className="text-2xl md:text-3xl font-bold mb-4">
               {t("presence.title")}
             </h2>
             <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
               {t("presence.text")}
             </p>
          </div>
        </div>
      </section>

      {/* 5. MISSION */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
           <div className="w-12 h-1 bg-red-600 mx-auto mb-6 rounded-full" />
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
             {t("mission.title")}
           </h3>
           <p className="text-xl text-gray-900 font-medium leading-relaxed">
             {t("mission.description")}
           </p>
        </div>
      </section>

      {/* 6. SOFT CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-md mx-auto px-4 flex flex-col sm:flex-row gap-4 justify-center">
           <LocalizedClientLink 
             href="/store" 
             className="block w-full sm:w-auto text-center px-8 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
           >
             {t("cta.store")}
           </LocalizedClientLink>
           <LocalizedClientLink 
             href="/customer-service" 
             className="block w-full sm:w-auto text-center px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
           >
             {t("cta.support")}
           </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
