"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const navItems = [
    { href: "/account", label: "Overview", icon: <User size={18} />, testId: "overview-link" },
    { href: "/account/profile", label: "Profile", icon: <User size={18} />, testId: "profile-link" },
    { href: "/account/addresses", label: "Addresses", icon: <MapPin size={18} />, testId: "addresses-link" },
    { href: "/account/orders", label: "Orders", icon: <Package size={18} />, testId: "orders-link" },
  ]

  const isActive = (href: string) => {
    const routePath = route?.split(countryCode)[1]
    if (href === "/account") {
      return routePath === href || routePath === "/account/"
    }
    return routePath?.startsWith(href)
  }

  return (
    <div>
      {/* Mobile: Horizontal scroll nav */}
      <div className="lg:hidden" data-testid="mobile-account-nav">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {navItems.map((item) => (
            <LocalizedClientLink
              key={item.href}
              href={item.href}
              className={clx(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              data-testid={item.testId}
            >
              {item.icon}
              <span>{item.label}</span>
            </LocalizedClientLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors"
            data-testid="logout-button"
          >
            <ArrowRightOnRectangle className="w-4.5 h-4.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Desktop: Vertical nav */}
      <div className="hidden lg:block" data-testid="account-nav">
        <div className="pb-4 mb-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {customer?.first_name ? `Hello, ${customer.first_name}` : 'My Account'}
          </h3>
        </div>
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
          <li className="pt-2 mt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle className="w-4.5 h-4.5" />
              <span>Log out</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-ui-fg-subtle hover:text-ui-fg-base", {
        "text-ui-fg-base font-semibold": active,
      })}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
