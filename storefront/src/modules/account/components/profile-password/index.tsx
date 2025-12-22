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

import { changePasswordWithOtp } from "@lib/data/customer"

const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const t = useTranslations('account')
  const te = useTranslations('errors')
  const ts = useTranslations('success')

  const [state, formAction] = useFormState<any, FormData>(changePasswordWithOtp, null)

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    if (typeof state === "string" && state.startsWith("success.")) {
      setSuccessState(true)
    }
  }, [state])

  const errorMessage = typeof state === "string" && !state.startsWith("success.") ? state : undefined

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label={t('password')}
        currentInfo={
          <span>{t('password_hidden')}</span>
        }
        isSuccess={successState}
        isError={!!errorMessage}
        errorMessage={errorMessage}
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
            label={t('sms_code')}
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
