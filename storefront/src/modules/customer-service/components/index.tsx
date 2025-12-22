"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"

// --- FAQ Component ---
const faqItems = [
  {
    q: "Где мой заказ?",
    a: "Статус заказа можно проверить в Личном кабинете. После передачи в BTS вы сможете отслеживать его по трек-номеру на сайте bts.uz.",
    link: "/account/orders",
    linkText: "Перейти в заказы",
  },
  {
    q: "Когда я смогу забрать товар?",
    a: "Срок доставки в пункт BTS обычно составляет 1-3 рабочих дня. Как только заказ прибудет, вам придет SMS от BTS.",
  },
  {
    q: "Где найти адрес пункта выдачи BTS?",
    a: "Адрес выбранного вами филиала указан в деталях заказа. Полный список всех пунктов BTS доступен на их официальном сайте.",
    link: "https://bts.uz/filials",
    linkText: "Все филиалы BTS",
  },
  {
    q: "Как оплатить заказ?",
    a: "Мы принимаем оплату картами Uzcard и Humo через платежные системы Payme и Click при оформлении на сайте.",
  },
  {
    q: "Можно ли отменить заказ?",
    a: "Да, если заказ еще не передан в службу доставки. Напишите нам в Telegram с указанием номера заказа.",
  },
  {
    q: "Как вернуть товар?",
    a: "Вы можете вернуть товар в течение 14 дней, если он не был в использовании и сохранен товарный вид. Внимание: бензоинструмент с ГСМ возврату не подлежит.",
  },
  {
    q: "Где найти гарантийный талон?",
    a: "Гарантийный талон находится внутри коробки с инструментом. При получении обязательно проверьте наличие печати.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-y-4 w-full max-w-[800px] mx-auto">
      <Heading level="h2" className="text-2xl font-bold mb-4">
        Часто задаваемые вопросы
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
      setError("Не удалось отправить сообщение. Попробуйте позже или напишите в Telegram.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center bg-green-50 rounded-xl border border-green-200">
        <Heading level="h3" className="text-green-800 mb-2">
          Сообщение отправлено!
        </Heading>
        <Text className="text-green-700">
          Спасибо! Мы ответим вам в Telegram или перезвоним в ближайшее время.
        </Text>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => setSuccess(false)}
        >
          Отправить еще одно
        </Button>
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
          Напишите нам
        </Heading>
        <Text className="text-ui-fg-subtle text-sm">
          Мы быстрее всего отвечаем в Telegram
        </Text>
      </div>

      <Input 
        name="name" 
        label="Ваше имя" 
        required 
        defaultValue={customer ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() : ""}
      />
      <Input 
        name="phone" 
        label="Номер телефона" 
        required 
        defaultValue={customer?.phone ?? ""} 
      />

      <div className="flex flex-col gap-y-1">
        <label className="text-sm font-medium text-ui-fg-subtle ml-1">Тема обращения</label>
        <NativeSelect name="topic" required>
          <option value="order_status">Статус заказа</option>
          <option value="return_warranty">Возврат / гарантия</option>
          <option value="product_query">Вопрос по товару</option>
          <option value="other">Другое</option>
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-y-1">
        <label className="text-sm font-medium text-ui-fg-subtle ml-1">Сообщение</label>
        <textarea
          name="message"
          required
          rows={4}
          className="p-3 rounded-lg border border-ui-border-base bg-ui-bg-field focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
        />
      </div>

      {error && <Text className="text-red-500 text-xs">{error}</Text>}

      <Button type="submit" isLoading={loading} className="w-full">
        Отправить
      </Button>
    </form>
  )
}

// --- Contact Grid Component ---
export function ContactGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <a
        href="https://t.me/toolbox01"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col p-6 bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-xl hover:bg-[#0088cc]/20 transition-all group"
      >
        <Heading level="h3" className="text-[#0088cc] font-bold mb-1">
          Telegram
        </Heading>
        <Text className="text-sm mb-4">Написать в чат поддержки</Text>
        <span className="text-sm font-bold text-[#0088cc] group-hover:underline">
          @toolbox01 →
        </span>
      </a>

      <a
        href="tel:+998880811112"
        className="flex flex-col p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl hover:bg-ui-bg-component transition-all"
      >
        <Heading level="h3" className="font-bold mb-1 uppercase text-xs tracking-widest text-ui-fg-subtle">
          Колл-центр
        </Heading>
        <Text className="text-lg font-bold">+998 88 081-11-12</Text>
        <Text className="text-xs text-ui-fg-muted mt-2">Ежедневно с 9:00 до 18:00</Text>
      </a>

      <a
        href="tel:+998881822910"
        className="flex flex-col p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl hover:bg-ui-bg-component transition-all"
      >
        <Heading level="h3" className="font-bold mb-1 uppercase text-xs tracking-widest text-ui-fg-subtle">
          Сервисный центр
        </Heading>
        <Text className="text-lg font-bold">+998 88 182-29-10</Text>
        <Text className="text-xs text-ui-fg-muted mt-2">По вопросам гарантии и ремонта</Text>
      </a>

      <div className="flex gap-x-4 p-6 bg-ui-bg-subtle border border-ui-border-base rounded-xl items-center justify-center">
        <a href="https://www.instagram.com/toolbox_buxoro" target="_blank" className="text-ui-fg-subtle hover:text-pink-600 transition-colors">
            Instagram
        </a>
        <a href="https://youtube.com/@toolbox_bukhara" target="_blank" className="text-ui-fg-subtle hover:text-red-600 transition-colors">
            YouTube
        </a>
      </div>
    </div>
  )
}

// --- Order CTA Component ---
export function OrderCTA() {
  return (
    <div className="w-full p-8 bg-black text-white rounded-2xl flex flex-col items-center text-center gap-y-4">
      <Heading level="h2" className="text-2xl font-bold">
        Проверить статус заказа
      </Heading>
      <Text className="text-white/70 max-w-[400px]">
        Посмотрите статус и историю ваших покупок в личном кабинете.
      </Text>
      <LocalizedClientLink href="/account/orders">
        <Button variant="secondary" className="bg-white text-black hover:bg-gray-200 border-none px-8">
          Мои заказы
        </Button>
      </LocalizedClientLink>
    </div>
  )
}
