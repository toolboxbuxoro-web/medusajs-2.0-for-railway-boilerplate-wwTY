"use client"

import React, { useState } from "react"
import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"
import { useTranslations } from 'next-intl'

import Package from "@modules/common/icons/package"
import Phone from "@modules/common/icons/phone"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { useAuth } from "@lib/context/auth-context"
import LogoutConfirmModal from "../logout-confirm-modal"
import ChangePhoneModal from "../change-phone-modal"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const { logout } = useAuth()
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const t = useTranslations('account')

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isChangePhoneModalOpen, setIsChangePhoneModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      await signout(countryCode)
    } finally {
      setIsLoggingOut(false)
      setIsLogoutModalOpen(false)
    }
  }

  const navItems = [
    { href: "/account/orders", label: t('orders'), icon: <Package size={18} />, testId: "orders-link" },
  ]

  const isActive = (href: string) => {
    const routePath = route?.split(countryCode)[1]
    return routePath?.startsWith(href)
  }

  return (
    <div>
      {/* Mobile & Desktop Menu */}
      <div data-testid="account-nav">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <LocalizedClientLink
                href={item.href}
                className={clx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-red-50 text-red-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                data-testid={item.testId}
              >
                {item.icon}
                <span>{item.label}</span>
              </LocalizedClientLink>
            </li>
          ))}
          
          {/* Change Phone Action */}
          <li>
            <button
              onClick={() => setIsChangePhoneModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-left"
            >
              <Phone size={18} />
              <span>{t('change_phone')}</span>
            </button>
          </li>

          {/* Logout Action */}
          <li className="pt-2 mt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle className="w-4.5 h-4.5" />
              <span>{t('logout')}</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Modals */}
      {customer && (
        <ChangePhoneModal
          customer={customer}
          isOpen={isChangePhoneModalOpen}
          onClose={() => setIsChangePhoneModalOpen(false)}
        />
      )}

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  )
}

export default AccountNav

