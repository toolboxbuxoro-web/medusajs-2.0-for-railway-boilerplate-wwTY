"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import EditProfileModal from "../edit-profile-modal"
import { useTranslations } from 'next-intl'

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileName: React.FC<MyInformationProps> = ({ customer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const t = useTranslations('account')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">
            {t('name')}
          </span>
          <span className="text-xl font-bold text-gray-900">
            {customer.first_name} {customer.last_name}
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

      <EditProfileModal
        customer={customer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default ProfileName
