"use client"

import SearchInput from "@modules/layout/components/search-input"

type NavSearchProps = {
  placeholder: string
}

export function DesktopSearch({ placeholder }: NavSearchProps) {
  return <SearchInput placeholder={placeholder} variant="desktop" />
}

export function MobileSearch({ placeholder }: NavSearchProps) {
  return <SearchInput placeholder={placeholder} variant="mobile" />
}

export function CompactSearch({ placeholder }: NavSearchProps) {
  return <SearchInput placeholder={placeholder} variant="compact" />
}
