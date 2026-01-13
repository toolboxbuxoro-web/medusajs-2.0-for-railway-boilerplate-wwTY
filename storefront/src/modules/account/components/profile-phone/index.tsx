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
import ChangePhoneModal from "../change-phone-modal"

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const t = useTranslations('account')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">
            {t('phone')}
          </span>
          <span className="text-xl font-bold text-gray-900">
            {customer.phone}
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900 group"
          title={t('edit') || "Редактировать"}
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      <ChangePhoneModal
        customer={customer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default ProfilePhone
