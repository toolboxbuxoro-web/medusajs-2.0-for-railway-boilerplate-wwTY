"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import User from "@modules/common/icons/user"

export default function ProfileButton({ label }: { label?: string }) {
  return (
    <LocalizedClientLink
      href="/account/orders"
      className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center sm:flex-col sm:gap-1"
      data-testid="nav-profile-link"
      title={label || "Profile"}
    >
      <User size="22" />
      {label && <span className="text-[10px] font-medium hidden sm:block">{label}</span>}
    </LocalizedClientLink>
  )
}
