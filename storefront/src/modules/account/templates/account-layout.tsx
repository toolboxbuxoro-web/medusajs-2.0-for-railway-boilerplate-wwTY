"use client"

import React from "react"
import { useTranslations } from 'next-intl'

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import ProfileHeader from "../components/profile-header"
import { useAuth } from "@lib/context/auth-context"

interface AccountLayoutProps {
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  children,
}) => {
  const t = useTranslations('account')
  const { customer, authStatus } = useAuth()

  if (authStatus !== "authorized") {
    return (
      <div className="flex-1" data-testid="account-page">
        {children}
      </div>
    )
  }
  
  return (
    <div className="flex-1 py-4 sm:py-8 lg:py-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen" data-testid="account-page">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-8">
            {/* Desktop & Mobile Sidebar-like area */}
            <div className="flex flex-col gap-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <ProfileHeader onLoginPress={() => {}} />
                <div className="p-4 lg:p-5">
                  <AccountNav customer={customer} />
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-10 shadow-sm min-h-[500px]">
              {children}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 lg:mt-8 bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-5 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-1">{t('have_questions')}</h3>
                <p className="text-sm sm:text-base text-white/80">
                  {t('find_answers')}
                </p>
              </div>
              <a 
                href="/customer-service" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-sm sm:text-base"
              >
                {t('support')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
