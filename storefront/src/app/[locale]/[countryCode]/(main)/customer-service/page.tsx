import { getTranslations } from "next-intl/server"
import { Heading, Text } from "@medusajs/ui"
import { FAQSection, SupportForm, ContactGrid, OrderCTA } from "@modules/customer-service/components"
import { getCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "customer_service" })

  return {
    title: t("seo_title"),
    description: t("seo_description"),
  }
}

export default async function CustomerServicePage({ params: { locale } }: { params: { locale: string } }) {
  const customer = await getCustomer()
  const t = await getTranslations({ locale, namespace: "customer_service" })

  return (
    <div className="py-12 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-y-16">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-y-4 py-8">
          <Heading level="h1" className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t("hero_title")}
          </Heading>
          <Text className="text-ui-fg-subtle text-lg max-w-[600px]">
            {t("hero_subtitle")}
          </Text>
        </section>

        {/* Order Status CTA */}
        <section className="max-w-[1000px] mx-auto w-full">
          <OrderCTA />
        </section>

        {/* FAQ Section */}
        <section id="faq">
          <FAQSection />
        </section>

        {/* Contact & Support Section */}
        <section className="max-w-[1000px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 border-t border-ui-border-base pt-16">
          <div className="flex flex-col gap-y-8">
            <header>
              <Heading level="h2" className="text-3xl font-bold mb-2">
                {t("contact_title")}
              </Heading>
              <Text className="text-ui-fg-subtle">
                {t("contact_subtitle")}
              </Text>
            </header>
            <ContactGrid />
          </div>

          <div id="contact-form">
            <SupportForm customer={customer} />
          </div>
        </section>

        {/* BTS Guide Info (Simple Text Block) */}
        <section className="max-w-[800px] mx-auto w-full py-12 bg-ui-bg-subtle/50 rounded-2xl px-8 flex flex-col gap-y-4">
          <Heading level="h3" className="text-xl font-bold">{t("bts_delivery_title")}</Heading>
          <Text className="text-sm leading-relaxed whitespace-pre-line">
            {t("bts_delivery_text")}
          </Text>
          <div className="pt-2">
            <LocalizedClientLink href="/delivery" className="text-red-600 hover:text-red-700 font-semibold underline">
              {t("delivery_details")}
            </LocalizedClientLink>
          </div>
        </section>

      </div>
    </div>
  )
}
