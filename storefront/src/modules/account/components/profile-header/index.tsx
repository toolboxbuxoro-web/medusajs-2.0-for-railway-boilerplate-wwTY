"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@lib/context/auth-context"
import AvatarInitials from "@modules/account/components/avatar-initials"
import EditProfileModal from "@modules/account/components/edit-profile-modal"

interface ProfileHeaderProps {
  onLoginPress?: () => void
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  return phone
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onLoginPress,
}) => {
  const t = useTranslations("account")
  const { authStatus, customer } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Loading state
  if (authStatus === "loading") {
    return (
      <div className="h-24 bg-white border-b border-gray-100">
        <div className="flex items-center h-full px-5 gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  // Unauthorized state
  if (authStatus === "unauthorized") {
    return (
      <div className="h-24 bg-white border-b border-gray-100">
        <button
          onClick={onLoginPress}
          className="flex items-center w-full h-full px-5 gap-4 hover:bg-gray-50 transition-colors"
        >
          <AvatarInitials size={48} backgroundColor="#F3F4F6" textColor="#9CA3AF" />
          <div className="flex-1 text-left">
            <p className="text-lg font-bold text-gray-900">{t("login_by_phone")}</p>
            <p className="text-sm text-gray-500">{t("get_access_to_orders")}</p>
          </div>
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    )
  }

  // Authorized state
  const displayName = customer?.first_name
    ? `${customer.first_name}${customer.last_name ? " " + customer.last_name : ""}`
    : t("user")

  return (
    <>
      <div className="h-24 bg-white border-b border-gray-100">
        <div className="flex items-center h-full px-5 gap-4">
          <AvatarInitials
            firstName={customer?.first_name}
            lastName={customer?.last_name}
            phone={customer?.phone}
            size={48}
            backgroundColor="#DC2626"
            textColor="#FFFFFF"
          />
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-sm text-gray-500 font-medium">
              {formatPhone(customer?.phone)}
            </p>
          </div>
          {/* Edit button (pencil icon) */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t("edit")}
          >
            <svg
              className="w-5 h-5"
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
      </div>

      {/* Edit Profile Modal */}
      {customer && (
        <EditProfileModal
          customer={customer}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  )
}

export default ProfileHeader

