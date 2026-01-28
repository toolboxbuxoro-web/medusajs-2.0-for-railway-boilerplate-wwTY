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
    { 
      href: "/delivery", 
      label: t('delivery') || 'Доставка и оплата', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      ), 
      testId: "delivery-link" 
    },
    { 
      href: "/customer-service", 
      label: t('customer_service') || 'Поддержка', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ), 
      testId: "support-link" 
    },
    { 
      href: "/about", 
      label: t('about_us') || 'О компании', 
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      ), 
      testId: "about-link" 
    },
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

