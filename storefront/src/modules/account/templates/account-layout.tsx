import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 py-4 sm:py-8 lg:py-12 bg-gray-50 min-h-screen" data-testid="account-page">
      <div className="content-container">
        <div className="max-w-5xl mx-auto">
          {/* Mobile Nav - Horizontal scroll */}
          <div className="lg:hidden mb-4 -mx-4 px-4">
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              {customer && <AccountNav customer={customer} />}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-8">
            {/* Desktop Nav - Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-4">
                {customer && <AccountNav customer={customer} />}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 lg:mt-8 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Got questions?</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Find answers on our customer service page.
                </p>
              </div>
              <UnderlineLink href="/customer-service" className="flex-shrink-0">
                Customer Service
              </UnderlineLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
