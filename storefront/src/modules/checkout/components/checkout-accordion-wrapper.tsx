"use client"

import React, { useEffect, useRef } from "react"
import { useCheckout, ContactSummary, PaymentSummary } from "@lib/context/checkout-context"
import AccordionSection from "./accordion-section"
import ContactAndDelivery from "./contact-and-delivery"
import Payment from "./payment"
import Review from "./review"
import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { paymentInfoMap } from "@lib/constants"

export default function CheckoutAccordionWrapper({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
  initialBtsData,
}: {
  cart: any
  customer: any
  shippingMethods: any[]
  paymentMethods: any[]
  initialBtsData: any
}) {
  const t = useTranslations("checkout")
  const { 
    activeSection, 
    setActiveSection, 
    contactCompleted, 
    paymentCompleted,
    contactSummary,
    paymentSummary,
    setContactCompleted,
    setPaymentCompleted
  } = useCheckout()

  // Initial check: if cart already has address and shipping method, mark contact as completed
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return

    if (cart?.shipping_address?.address_1 && (cart?.shipping_methods?.length ?? 0) > 0 && !contactCompleted) {
      initializedRef.current = true
      
      setContactCompleted({
        firstName: cart.shipping_address.first_name || "",
        lastName: cart.shipping_address.last_name || "",
        phone: cart.shipping_address.phone || "",
        region: cart.metadata?.bts_delivery?.region,
        point: cart.metadata?.bts_delivery?.point,
      })
      
      // If payment is also ready, we might want to advance further
      const hasPayment = !!(cart.payment_collection || cart.payment_sessions?.length)
      if (hasPayment) {
        setPaymentCompleted({
          method: cart.payment_collection?.payment_sessions?.[0]?.provider_id || "payment_method"
        })
        setActiveSection(3)
      } else {
        setActiveSection(2)
      }
    }
  }, [cart, contactCompleted, setContactCompleted, setPaymentCompleted, setActiveSection])

  const scrollToSection = (sectionNumber: number) => {
    setTimeout(() => {
      const element = document.getElementById(`checkout-section-${sectionNumber}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="w-full flex flex-col gap-y-4 lg:gap-y-6">
      {/* Section 1: Contact + Delivery */}
      <AccordionSection
        number={1}
        title={t('information_and_delivery')}
        isOpen={activeSection === 1}
        isCompleted={contactCompleted}
        onToggle={() => setActiveSection(1)}
        summary={
          contactSummary && (
            <div className="text-sm text-gray-500 flex flex-col">
              <span>{contactSummary.firstName} {contactSummary.lastName} | {contactSummary.phone}</span>
              {contactSummary.point && (
                <span className="font-medium text-gray-700">{contactSummary.region}, {contactSummary.point}</span>
              )}
            </div>
          )
        }
      >
        <ContactAndDelivery 
          cart={cart} 
          customer={customer} 
          availableShippingMethods={shippingMethods}
          initialBtsData={initialBtsData}
          onComplete={(data: ContactSummary) => {
            setContactCompleted(data)
            setActiveSection(2)
            scrollToSection(2)
          }}
        />
      </AccordionSection>

      {/* Section 2: Payment */}
      <AccordionSection
        number={2}
        title={t('payment')}
        isOpen={activeSection === 2}
        isCompleted={paymentCompleted}
        isLocked={!contactCompleted}
        onToggle={() => setActiveSection(2)}
        summary={
          paymentSummary && (
            <div className="text-sm text-gray-500">
            <div className="text-sm text-gray-500">
              {t('payment_method_selected')}: <span className="font-medium text-gray-700 font-bold uppercase">{paymentInfoMap[paymentSummary.method.toLowerCase()]?.title || t(paymentSummary.method.toLowerCase()) || paymentSummary.method}</span>
            </div>
            </div>
          )
        }
      >
        <Payment 
          cart={cart} 
          availablePaymentMethods={paymentMethods} 
          onComplete={(data: PaymentSummary) => {
            setPaymentCompleted(data)
            setActiveSection(3)
            scrollToSection(3)
          }}
        />
      </AccordionSection>

      {/* Section 3: Review */}
      <AccordionSection
        number={3}
        title={t('review_and_place_order')}
        isOpen={activeSection === 3}
        isCompleted={false} // Never "completed" until order is placed
        isLocked={!paymentCompleted}
        onToggle={() => setActiveSection(3)}
      >
        <Review cart={cart} />
      </AccordionSection>
      
      {/* Mobile progress indicator placeholder */}
      <div className="lg:hidden mt-4 px-2">
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500" 
            style={{ width: `${(activeSection / 3) * 100}%` }}
          />
        </div>
        <Text className="text-[10px] text-gray-400 mt-1 text-center uppercase tracking-widest font-bold">
          {t('step_progress', { current: activeSection, total: 3 })}
        </Text>
      </div>
    </div>
  )
}
