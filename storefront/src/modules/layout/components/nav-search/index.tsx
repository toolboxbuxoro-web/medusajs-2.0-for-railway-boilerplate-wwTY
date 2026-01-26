"use client"

import SearchInput from "@modules/layout/components/search-input"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { useCitySearch } from "@lib/context/city-search-context"

type NavSearchProps = {
  placeholder: string
}

export function DesktopSearch({ placeholder }: NavSearchProps) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { selectedRegionId } = useCitySearch()
  
  const isPickupPointsPage = pathname?.includes("/pickup-points")
  const searchPlaceholder = isPickupPointsPage
    ? selectedRegionId
      ? t("find_pickup_point") || "Найти пункт выдачи"
      : t("find_city") || "Найти город"
    : placeholder

  return <SearchInput placeholder={searchPlaceholder} variant="desktop" />
}

export function MobileSearch({ placeholder }: NavSearchProps) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { selectedRegionId } = useCitySearch()
  
  const isPickupPointsPage = pathname?.includes("/pickup-points")
  const searchPlaceholder = isPickupPointsPage
    ? selectedRegionId
      ? t("find_pickup_point") || "Найти пункт выдачи"
      : t("find_city") || "Найти город"
    : placeholder

  return <SearchInput placeholder={searchPlaceholder} variant="mobile" />
}

export function CompactSearch({ placeholder }: NavSearchProps) {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const { selectedRegionId } = useCitySearch()
  
  const isPickupPointsPage = pathname?.includes("/pickup-points")
  const searchPlaceholder = isPickupPointsPage
    ? selectedRegionId
      ? t("find_pickup_point") || "Найти пункт выдачи"
      : t("find_city") || "Найти город"
    : placeholder

  return <SearchInput placeholder={searchPlaceholder} variant="compact" />
}
