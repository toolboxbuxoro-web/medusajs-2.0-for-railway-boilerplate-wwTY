"use client"

import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { forgotPassword } from "@lib/data/customer"
import { useTranslations } from "next-intl"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(forgotPassword, null)
  const t = useTranslations("account")

  return (
    <div className="w-full flex flex-col" data-testid="forgot-password-page">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {t("reset_password") || "Сброс пароля"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {t("reset_password_description") || "Введите телефон, получите код по SMS и задайте новый пароль."}
        </p>
      </div>

      <form className="w-full space-y-4" action={formAction}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("phone") || "Телефон"} <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            type="tel"
            required
            placeholder="+998 90 123 45 67"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
            data-testid="reset-phone-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("sms_code") || "Код из SMS"}
          </label>
          <input
            name="otp_code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
            data-testid="reset-otp-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("new_password") || "Новый пароль"}
          </label>
          <input
            name="new_password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
            data-testid="reset-new-password-input"
          />
        </div>

        <ErrorMessage error={message} data-testid="forgot-password-message" />

        <button
          type="submit"
          className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
          data-testid="reset-password-submit"
        >
          {t("send_code_or_reset") || "Отправить код / Сбросить пароль"}
        </button>
      </form>

      <button
        onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
        className="mt-4 w-full py-3 sm:py-3.5 border-2 border-gray-200 hover:border-red-500 text-gray-700 hover:text-red-600 font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base"
      >
        {t("back_to_login") || "Назад ко входу"}
      </button>
    </div>
  )
}

export default ForgotPassword





