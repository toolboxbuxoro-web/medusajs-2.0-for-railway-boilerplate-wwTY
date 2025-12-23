"use client"

import { useState, useEffect, useCallback } from "react"
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
  const te = useTranslations("errors")
  const ts = useTranslations("success")

  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [timer, setTimer] = useState(0)

  // Move to step 2 if OTP was sent successfully
  useEffect(() => {
    if (message === "otp_sent") {
      setStep(2)
      setTimer(60)
    } else if (message === "otp_cooldown") {
      setTimer(60)
    }
  }, [message])

  // Timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleResend = useCallback(async () => {
    if (timer > 0) return
    const formData = new FormData()
    formData.append("phone", phone)
    formAction(formData)
    setTimer(60)
  }, [timer, phone, formAction])

  const isSuccess = message === "success.password_reset"

  return (
    <div className="w-full flex flex-col" data-testid="forgot-password-page">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {t("reset_password") || "Сброс пароля"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isSuccess 
            ? ts("password_reset")
            : (step === 1 ? t("reset_password_description") : te("otp_sent"))
          }
        </p>
      </div>

      {isSuccess ? (
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          {t("sign_in")}
        </button>
      ) : (
        <form className="w-full space-y-4" action={formAction}>
          {/* Phone Input */}
          <div className={step === 2 ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("phone") || "Телефон"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                data-testid="reset-phone-input"
                readOnly={step === 2}
              />
            </div>
          </div>

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* OTP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("sms_code") || "Код из SMS"}
                </label>
                <input
                  name="otp_code"
                  type="text"
                  inputMode="numeric"
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="reset-otp-input"
                />
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors"
                  >
                    {timer > 0 ? t("otp_resend_in", { seconds: timer }) : t("otp_resend")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
                  >
                    {t('change') || "Изменить номер"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("new_password") || "Новый пароль"}
                </label>
                <input
                  name="new_password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="reset-new-password-input"
                />
              </div>
            </div>
          )}

          <ErrorMessage error={typeof message === "string" ? message : undefined} data-testid="forgot-password-message" />

          <button
            type="submit"
            className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
            data-testid="reset-password-submit"
          >
            {step === 1 ? t("otp_get_code") : (t("reset_password"))}
          </button>
        </form>
      )}

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












