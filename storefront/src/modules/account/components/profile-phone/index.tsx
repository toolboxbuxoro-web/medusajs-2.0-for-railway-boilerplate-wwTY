"use client"

import React, { useEffect } from "react"
import { useFormState } from "react-dom"

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

import { useTranslations } from 'next-intl'
import { changePhoneWithOtp } from "@lib/data/customer"

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const t = useTranslations('account')
  const te = useTranslations('errors')

  const [state, formAction] = useFormState<any, FormData>(changePhoneWithOtp, null)

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
    <form action={formAction} className="w-full">
      <AccountInfo
        label={t('phone')}
        currentInfo={`${customer.phone}`}
        isSuccess={successState}
        isError={!!errorMessage}
        errorMessage={errorMessage}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <div className="grid grid-cols-1 gap-y-4">
          <Input
            label={t('phone')}
            name="phone"
            type="tel"
            required
            defaultValue={customer.phone ?? ""}
            data-testid="phone-input"
          />
          <Input
            label={t('sms_code') || "Код из SMS"}
            name="otp_code"
            type="text"
            data-testid="otp-code-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePhone
