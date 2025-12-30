"use client"

import { useState, FormEvent } from "react"

type B2BFormProps = {
  isRussian: boolean
}

export function B2BForm({ isRussian }: B2BFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      companyName: formData.get("companyName") as string,
      contactName: formData.get("contactName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      comment: formData.get("comment") as string,
    }

    try {
      const res = await fetch("/api/b2b/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to send")
      }

      setSuccess(true)
      // Reset form
      e.currentTarget.reset()
    } catch (err: any) {
      setError(
        err.message ||
          (isRussian
            ? "Ошибка при отправке заявки. Попробуйте позже."
            : "Ariza yuborishda xatolik. Keyinroq urinib ko'ring.")
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          {isRussian ? "Заявка отправлена!" : "Ariza yuborildi!"}
        </h3>
        <p className="text-green-700 mb-4">
          {isRussian
            ? "Наш менеджер свяжется с вами в ближайшее время"
            : "Menejerimiz tez orada siz bilan bog'lanadi"}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {isRussian ? "Отправить еще одну" : "Yana birini yuborish"}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isRussian ? "Название компании" : "Kompaniya nomi"}{" "}
          <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="companyName"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
          placeholder={isRussian ? 'ООО "Компания"' : '"Kompaniya" MChJ'}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isRussian ? "Контактное лицо" : "Aloqa shaxsi"}{" "}
          <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="contactName"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
          placeholder={isRussian ? "Ваше имя" : "Ismingiz"}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isRussian ? "Телефон" : "Telefon"}{" "}
          <span className="text-red-600">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
          placeholder="+998 __ ___ __ __"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isRussian ? "Email" : "Email"}{" "}
          <span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
          placeholder="company@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {isRussian ? "Комментарий" : "Izoh"}
        </label>
        <textarea
          name="comment"
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
          placeholder={
            isRussian
              ? "Какие товары вас интересуют?"
              : "Qaysi mahsulotlar sizni qiziqtiradi?"
          }
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-red-600/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? isRussian
            ? "Отправка..."
            : "Yuborilmoqda..."
          : isRussian
          ? "Отправить заявку"
          : "Arizani yuborish"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {isRussian
          ? "Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности"
          : "Tugmani bosish orqali siz maxfiylik siyosatiga rozilik bildirasiz"}
      </p>
    </form>
  )
}

