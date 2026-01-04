import { Metadata } from "next"
import FavoritesTemplate from "@modules/favorites/templates"
import { getTranslations } from "next-intl/server"

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your favorite products",
}

export default async function FavoritesPage({
  params: { countryCode, locale },
}: {
  params: { countryCode: string; locale: string }
}) {
  return <FavoritesTemplate countryCode={countryCode} />
}
