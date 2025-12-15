"use client"

import React, { useEffect } from "react"

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

import { useTranslations } from 'next-intl'

const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const t = useTranslations('account')

  const changePassword = async (_currentState: Record<string, any>, formData: FormData) => {
    const phone = (formData.get("phone") as string) || ""
    const code = (formData.get("otp_code") as string) || ""
    const oldPassword = (formData.get("old_password") as string) || ""
    const newPassword = (formData.get("new_password") as string) || ""
    const confirm = (formData.get("confirm_password") as string) || ""

    if (!phone) {
      return { success: false, error: "Укажите номер телефона в профиле" }
    }

    if (!oldPassword || !newPassword || !confirm) {
      return { success: false, error: "Заполните поля пароля" }
    }

    if (newPassword !== confirm) {
      return { success: false, error: "Пароли не совпадают" }
    }

    const backend = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

    // Step 1: send OTP if not provided
    if (!code) {
      const r = await fetch(`${backend}/store/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "change_password" }),
        cache: "no-store",
      })

      if (!r.ok) {
        return { success: false, error: "Не удалось отправить код" }
      }

      return { success: false, error: "Код отправлен по SMS. Введите код и нажмите «Сохранить» ещё раз." }
    }

    // Step 2: change password
    const resp = await fetch(`${backend}/store/otp/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        code,
        old_password: oldPassword,
        new_password: newPassword,
      }),
      cache: "no-store",
    })

    if (!resp.ok) {
      return { success: false, error: "Не удалось изменить пароль" }
    }

    return { success: true, error: null }
  }

  const [state, formAction] = useFormState(changePassword, {
    success: false,
    error: null,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label={t('password')}
        currentInfo={
          <span>{t('password_hidden')}</span>
        }
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error ?? undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <input type="hidden" name="phone" value={customer.phone ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('old_password')}
            name="old_password"
            required
            type="password"
            data-testid="old-password-input"
          />
          <Input
            label={t('new_password')}
            type="password"
            name="new_password"
            required
            data-testid="new-password-input"
          />
          <Input
            label={t('confirm_password')}
            type="password"
            name="confirm_password"
            required
            data-testid="confirm-password-input"
          />
          <Input
            label={t('sms_code') || "Код из SMS"}
            type="text"
            name="otp_code"
            data-testid="otp-code-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword
