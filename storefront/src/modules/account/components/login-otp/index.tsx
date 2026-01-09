"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import ErrorMessage from "@modules/checkout/components/error-message"



function normalizeUzPhone(input: string): string | null {
  if (!input) return null
  const digits = input.replace(/\D/g, "")
  if (digits.startsWith("998") && digits.length === 12) return digits
  if (digits.length === 9) return `998${digits}`
  if (digits.length === 10 && digits.startsWith("0")) return `998${digits.slice(1)}`
  return null
}

/**
 * OTP-based Login Component
 * Uses the same endpoints as mobile app:
 * - POST /store/mobile/auth/request-otp
 * - POST /store/mobile/auth/verify-otp
 */
const LoginOtp = () => {
  const router = useRouter()
  const t = useTranslations("account")
  const te = useTranslations("errors")

  // Form state
  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<1 | 2>(1)
  
  // Loading/error state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Timer for resend
  const [resendTimer, setResendTimer] = useState(0)

  // Timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const backendUrl = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  ).replace(/\/$/, "")
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  /**
   * Step 1: Request OTP
   */
  const handleRequestOtp = async () => {
    const normalized = normalizeUzPhone(phone)
    if (!normalized) {
      setError(te("invalid_phone"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${backendUrl}/store/mobile/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        body: JSON.stringify({ phone: normalized }),
      })

      const data = await resp.json()

      if (resp.ok && data.success) {
        setStep(2)
        setResendTimer(60)
      } else {
        setError(data.error || te("failed_to_send_otp"))
      }
    } catch (e: any) {
      setError(te("error_occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Step 2: Verify OTP and get JWT
   */
  const handleVerifyOtp = async () => {
    const normalized = normalizeUzPhone(phone)
    if (!normalized || !otpCode) {
      setError(te("phone_and_code_required"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${backendUrl}/store/mobile/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        body: JSON.stringify({ phone: normalized, code: otpCode.trim() }),
      })

      const data = await resp.json()

      if (resp.ok && data.token) {
        // Call server action to set httpOnly cookie
        const { loginWithOtpToken } = await import("@lib/data/customer")
        const result = await loginWithOtpToken(data.token)
        
        if (result === "success") {
          // Redirect to account page
          router.push("/account")
          router.refresh()
        } else {
          setError(result || te("error_occurred"))
        }
      } else {
        setError(data.error || te("invalid_code"))
      }
    } catch (e: any) {
      console.error("[LoginOtp] Error:", e)
      setError(te("error_occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    setOtpCode("")
    handleRequestOtp()
  }

  return (
    <div className="w-full flex flex-col" data-testid="login-otp-page">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {t("welcome_back")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {step === 1
            ? t("otp_login_description") || "Войдите по номеру телефона"
            : te("otp_sent") || "Введите код из SMS"}
        </p>
      </div>

      {/* Form */}
      <div className="w-full space-y-4">
        {/* Phone Input */}
        <div className={step === 2 ? "opacity-50 pointer-events-none" : ""}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("phone")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              placeholder="+998 90 123 45 67"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
              data-testid="otp-phone-input"
              readOnly={step === 2}
            />
          </div>
        </div>

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("sms_code") || "Код из SMS"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base text-center text-xl tracking-widest font-mono"
                data-testid="otp-code-input"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0}
                className="font-medium text-red-600 hover:text-red-700 disabled:text-gray-400 transition-colors"
              >
                {resendTimer > 0
                  ? t("otp_resend_in", { seconds: resendTimer })
                  : t("otp_resend")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setOtpCode("")
                }}
                className="font-medium text-gray-500 hover:text-gray-700 underline"
              >
                {t("change") || "Изменить номер"}
              </button>
            </div>
          </div>
        )}

        <ErrorMessage error={error || undefined} data-testid="otp-login-error" />

        {/* Submit Button */}
        <button
          type="button"
          onClick={step === 1 ? handleRequestOtp : handleVerifyOtp}
          disabled={isLoading || (step === 1 && !phone) || (step === 2 && otpCode.length < 6)}
          className="w-full py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          data-testid="otp-submit-button"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {step === 1 ? t("otp_sending") || "Отправка..." : "..."}
            </span>
          ) : step === 1 ? (
            t("otp_get_code") || "Получить код"
          ) : (
            t("sign_in") || "Войти"
          )}
        </button>
      </div>
    </div>
  )
}

export default LoginOtp
