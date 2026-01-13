"use client"

import React, { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Modal from "@modules/common/components/modal"
import Input from "@modules/common/components/input"
import { Button, clx } from "@medusajs/ui"
import { useAuth } from "@lib/context/auth-context"
import { useTranslations } from "next-intl"
import ErrorMessage from "@modules/checkout/components/error-message"

type ChangePhoneModalProps = {
  customer: HttpTypes.StoreCustomer
  isOpen: boolean
  onClose: () => void
}

function normalizeUzPhone(input: string): string | null {
  if (!input) return null
  const digits = input.replace(/\D/g, "")
  if (digits.startsWith("998") && digits.length === 12) return digits
  if (digits.length === 9) return `998${digits}`
  if (digits.length === 10 && digits.startsWith("0")) return `998${digits.slice(1)}`
  return null
}

const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const t = useTranslations("account")
  const te = useTranslations("errors")
  const { refreshSession } = useAuth()

  const [phone, setPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

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

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const normalized = normalizeUzPhone(phone)
    if (!normalized) {
      setError(te("invalid_phone"))
      return
    }

    if (normalized === customer.phone) {
      setError(t("phone_already_used") || "Этот номер уже используется")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const resp = await fetch(`${backendUrl}/store/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        body: JSON.stringify({ phone: normalized, purpose: "change_phone" }),
      })

      if (resp.ok) {
        setStep(2)
        setResendTimer(60)
      } else {
        const data = await resp.json()
        setError(data.error || te("failed_to_send_otp"))
      }
    } catch (err: any) {
      setError(te("error_occurred"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeUzPhone(phone)
    if (!normalized || !otpCode) {
      setError(te("phone_and_code_required"))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const resp = await fetch(`${backendUrl}/store/otp/change-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
        },
        body: JSON.stringify({ phone: normalized, code: otpCode.trim() }),
      })

      if (resp.ok) {
        await refreshSession()
        setStep(3) // Show success state
      } else {
        const data = await resp.json()
        setError(data.error || te("invalid_code"))
      }
    } catch (err: any) {
      setError(te("error_occurred"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    setOtpCode("")
    handleRequestOtp()
  }

  return (
    <Modal isOpen={isOpen} close={onClose} size="small">
      <Modal.Title>{t("change_phone") || "Смена номера телефона"}</Modal.Title>
      <Modal.Body>
        <div className="w-full space-y-4 pt-4">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                {t("change_phone_description") || "Введите новый номер телефона. Мы отправим на него код подтверждения."}
              </p>
              <Input
                label={t("phone")}
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                data-testid="new-phone-input"
              />
              {error && <ErrorMessage error={error} />}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                  {t("cancel")}
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={!phone}>
                  {t("otp_get_code") || "Получить код"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                {te("otp_sent") || "Введите код из SMS, отправленный на номер"} <span className="font-semibold">{phone}</span>
              </p>
              <Input
                label={t("sms_code")}
                name="otp_code"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                maxLength={6}
                data-testid="otp-code-input"
              />
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isSubmitting}
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
                    setError(null)
                  }}
                  className="font-medium text-gray-500 hover:text-gray-700 underline"
                >
                  {t("change") || "Изменить номер"}
                </button>
              </div>
              {error && <ErrorMessage error={error} />}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                  {t("cancel")}
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={otpCode.length < 6}>
                  {t("confirm") || "Подтвердить"}
                </Button>
              </div>
            </form>
          )}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {t("otp_phone_verified")}
              </p>
              <p className="text-sm text-gray-600">
                {phone}
              </p>
              <div className="pt-4">
                <Button variant="primary" onClick={onClose}>
                  {t("cancel") || "Закрыть"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default ChangePhoneModal
