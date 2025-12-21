"use client"

import { useState, useEffect, useCallback } from "react"
import { useFormState } from "react-dom"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
import { useTranslations } from 'next-intl'

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(signup, null)
  const t = useTranslations('account')
  const te = useTranslations('errors')
  
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [timer, setTimer] = useState(0)

  // Move to step 2 if OTP was sent successfully
  useEffect(() => {
    if (message === "otp_sent_info" || message === "otp_sent") {
      setStep(2)
      setTimer(60)
    } else if (message === "otp_cooldown") {
      // Start timer even on cooldown error
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
    // Trigger form submission manually for resend (which just sends OTP again if no code provided)
    const formData = new FormData()
    formData.append("phone", phone)
    formAction(formData)
    setTimer(60)
  }, [timer, phone, formAction])

  const isAccountExists = message === "account_exists"

  return (
    <div
      className="w-full flex flex-col"
      data-testid="register-page"
    >
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {t('become_member')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {step === 1 ? t('register_description') : te('otp_sent_info')}
        </p>
      </div>

      {/* Form */}
      <form className="w-full space-y-4" action={formAction}>
        {/* Step 1: Phone Input */}
        <div className={step === 2 ? "opacity-50 pointer-events-none" : ""}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('phone')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              name="phone"
              type="tel"
              required={step === 1}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
              data-testid="phone-input"
              readOnly={step === 2}
            />
          </div>
        </div>

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* OTP Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('sms_code') || "Код из SMS"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8a2 2 0 01-2-2H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v6" />
                  </svg>
                </div>
                <input
                  name="otp_code"
                  type="text"
                  inputMode="numeric"
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="otp-code-input"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors"
                >
                  {timer > 0 ? `Отправить повторно через ${timer}с` : "Отправить код повторно"}
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

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('first_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  name="first_name"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder={t('first_name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="first-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('last_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  name="last_name"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder={t('last_name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="last-name-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  data-testid="password-input"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          {isAccountExists ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {te('account_exists')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
                  className="flex-1 py-2.5 bg-white border border-red-200 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  {t('sign_in')}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  {t('forgot_password') || "Восстановить"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <ErrorMessage error={typeof message === "string" && message.startsWith("errors.") ? te(message.replace("errors.", "") as any) : (typeof message === "string" ? message : "")} data-testid="register-error" />
              
              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="register-button"
              >
                {step === 1 ? "Получить код" : t('create_account')}
              </button>
            </>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          {t('terms_agreement_start')}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="text-red-600 hover:underline"
          >
            {t('privacy_policy')}
          </LocalizedClientLink>
          {t('and')}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="text-red-600 hover:underline"
          >
            {t('terms_of_use')}
          </LocalizedClientLink>
          {t('terms_agreement_end')}
        </p>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">{t('already_member')}</span>
        </div>
      </div>

      {/* Sign In Link */}
      <button
        onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
        className="w-full py-3 sm:py-3.5 border-2 border-gray-200 hover:border-red-500 text-gray-700 hover:text-red-600 font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base"
      >
        {t('sign_in')}
      </button>
    </div>
  )
}

export default Register
