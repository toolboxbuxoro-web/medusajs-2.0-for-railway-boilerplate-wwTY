"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

export function FAQSection() {
  const t = useTranslations("customer_service")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqItems = [
    t.raw("faq_items.item1"),
    t.raw("faq_items.item2"),
    t.raw("faq_items.item3"),
    t.raw("faq_items.item4"),
    t.raw("faq_items.item5"),
    t.raw("faq_items.item6"),
    t.raw("faq_items.item7"),
  ]

  return (
    <div className="flex flex-col gap-y-4 w-full max-w-[800px] mx-auto">
      <Heading level="h2" className="text-2xl font-bold mb-4">
        {t("faq_title")}
      </Heading>
      <div className="flex flex-col gap-y-2">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="border border-ui-border-base rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex justify-between items-center w-full p-4 text-left hover:bg-ui-bg-subtle transition-colors"
            >
              <Text className="font-semibold">{item.q}</Text>
              <span className="text-2xl">{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && (
              <div className="p-4 bg-ui-bg-subtle border-t border-ui-border-base">
                <Text className="mb-2">{item.a}</Text>
                {item.link && (
                  <LocalizedClientLink
                    href={item.link}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    {item.linkText}
                  </LocalizedClientLink>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Support Form Component ---
type SupportFormProps = {
  customer: HttpTypes.StoreCustomer | null
}

export function SupportForm({ customer }: SupportFormProps) {
  const t = useTranslations("customer_service")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch("/api/support/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to send")
      setSuccess(true)
    } catch (err) {
      setError(t("send_error"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center bg-green-50 rounded-xl border border-green-200">
        <Heading level="h3" className="text-green-800 mb-2">
          {t("send_success_title")}
        </Heading>
        <Text className="text-green-700">
          {t("send_success_text")}
        </Text>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          {t("send_another")}
        </Button>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-ui-bg-subtle rounded-xl border border-ui-border-base text-center gap-y-4">
        <div className="bg-ui-bg-base p-4 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ui-fg-subtle"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <div>
          <Heading level="h3" className="text-xl font-bold mb-2">
            {t("auth_required_title")}
          </Heading>
          <Text className="text-ui-fg-subtle text-sm max-w-[300px] mx-auto">
            {t("auth_required_text")}
          </Text>
        </div>
        <div className="flex flex-col w-full gap-y-2 pt-2">
          <LocalizedClientLink href="/account/login">
            <Button variant="primary" className="w-full">
              {t("login_button")}
            </Button>
          </LocalizedClientLink>
          <Text className="text-xs text-ui-fg-muted">
            {t("no_account")}{" "}
            <LocalizedClientLink href="/account/login" className="text-ui-fg-interactive hover:underline">
              {t("register_link")}
            </LocalizedClientLink>
          </Text>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-y-4 p-6 bg-ui-bg-subtle rounded-xl border border-ui-border-base"
    >
      <div className="mb-2">
        <Heading level="h3" className="text-xl font-bold">
          {t("write_to_us")}
        </Heading>
        <Text className="text-ui-fg-subtle text-sm">
          {t("telegram_fast_reply")}
        </Text>
      </div>

      <Input 
        name="name" 
        label={t("name")} 
        required 
        defaultValue={`${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()}
      />
      <Input 
        name="phone" 
        label={t("phone")} 
        required 
        defaultValue={customer.phone ?? ""} 
      />

      <div className="flex flex-col gap-y-1">
        <label className="text-sm font-medium text-ui-fg-subtle ml-1">{t("topic")}</label>
        <NativeSelect name="topic" required>
          <option value="order_status">{t("topic_order_status")}</option>
          <option value="return_warranty">{t("topic_return_warranty")}</option>
          <option value="product_query">{t("topic_product_query")}</option>
          <option value="other">{t("topic_other")}</option>
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-y-1">
        <label className="text-sm font-medium text-ui-fg-subtle ml-1">{t("message")}</label>
        <textarea
          name="message"
          required
          rows={4}
          className="p-3 rounded-lg border border-ui-border-base bg-ui-bg-field focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
        />
      </div>

      {error && <Text className="text-red-500 text-xs">{error}</Text>}

      <Button type="submit" isLoading={loading} className="w-full">
        {t("send")}
      </Button>
    </form>
  )
}

// --- Contact Grid Component ---
export function ContactGrid() {
  const t = useTranslations("customer_service")
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <a
        href="https://t.me/toolbox01"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col p-6 bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-xl hover:bg-[#0088cc]/20 transition-all group"
      >
        <Heading level="h3" className="text-[#0088cc] font-bold mb-1">
          {t("telegram_title")}
        </Heading>
        <Text className="text-sm mb-4">{t("telegram_subtitle")}</Text>
        <span className="text-sm font-bold text-[#0088cc] group-hover:underline">
          @toolbox01 →
        </span>
      </a>

      <a
        href="tel:+998880811112"
        className="flex flex-col p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl hover:bg-ui-bg-component transition-all"
      >
        <Heading level="h3" className="font-bold mb-1 uppercase text-xs tracking-widest text-ui-fg-subtle">
          {t("call_center")}
        </Heading>
        <Text className="text-lg font-bold">+998 88 081-11-12</Text>
        <Text className="text-xs text-ui-fg-muted mt-2">{t("call_center_hours")}</Text>
      </a>

      <a
        href="tel:+998881822910"
        className="flex flex-col p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl hover:bg-ui-bg-component transition-all"
      >
        <Heading level="h3" className="font-bold mb-1 uppercase text-xs tracking-widest text-ui-fg-subtle">
          {t("service_center")}
        </Heading>
        <Text className="text-lg font-bold">+998 88 182-29-10</Text>
        <Text className="text-xs text-ui-fg-muted mt-2">{t("service_center_subtitle")}</Text>
      </a>

      <div className="flex gap-x-4 p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl items-center justify-center">
        <a href="https://www.instagram.com/toolbox_buxoro" target="_blank" className="flex items-center gap-2 text-ui-fg-subtle hover:text-pink-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>Instagram</span>
        </a>
        <a href="https://youtube.com/@toolbox_bukhara" target="_blank" className="flex items-center gap-2 text-ui-fg-subtle hover:text-red-600 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>YouTube</span>
        </a>
      </div>
    </div>
  )
}

// --- Order CTA Component ---
export function OrderCTA() {
  const t = useTranslations("customer_service")
  return (
    <div className="w-full p-8 bg-black text-white rounded-2xl flex flex-col items-center text-center gap-y-4">
      <Heading level="h2" className="text-2xl font-bold">
        {t("order_status_title")}
      </Heading>
      <Text className="text-white/70 max-w-[400px]">
        {t("order_status_subtitle")}
      </Text>
      <LocalizedClientLink href="/account/orders">
        <Button variant="secondary" className="bg-white text-black hover:bg-gray-200 border-none px-8">
          {t("my_orders")}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}
