import { Metadata } from "next"
import { Heading, Text } from "@medusajs/ui"
import { FAQSection, SupportForm, ContactGrid, OrderCTA } from "@modules/customer-service/components"
import { getCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Поддержка клиентов | Toolbox",
  description: "Помощь в оформлении заказов, информация о доставке BTS и гарантии на инструменты в Toolbox.",
}

export default async function CustomerServicePage() {
  const customer = await getCustomer()

  return (
    <div className="py-12 px-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-y-16">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-y-4 py-8">
          <Heading level="h1" className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Центр поддержки Toolbox
          </Heading>
          <Text className="text-ui-fg-subtle text-lg max-w-[600px]">
            Мы здесь, чтобы помочь вам с выбором инструмента, отслеживанием заказа или вопросами по гарантии.
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
                Связаться с поддержкой
              </Heading>
              <Text className="text-ui-fg-subtle">
                Выберите удобный способ связи. Наши операторы готовы ответить на все вопросы в рабочие часы.
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
          <Heading level="h3" className="text-xl font-bold">О доставке BTS Express</Heading>
          <Text className="text-sm leading-relaxed">
            Мы работаем по модели <strong>BTS-Only</strong>. Это означает, что доставка осуществляется исключительно до пунктов выдачи (Pickup Points) службы BTS Express по всему Узбекистану. 
            <br /><br />
            После того как ваш заказ прибудет в филиал, вам придет официальное SMS-уведомление от BTS. Для получения заказа потребуется паспорт или мобильное приложение BTS.
          </Text>
          <div className="pt-2">
            <LocalizedClientLink href="/delivery" className="text-red-600 hover:text-red-700 font-semibold underline">
              Подробнее о доставке и сроках →
            </LocalizedClientLink>
          </div>
        </section>

      </div>
    </div>
  )
}
