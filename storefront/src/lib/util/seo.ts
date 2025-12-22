import { locales } from "../../i18n"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolbox.uz"

/**
 * Generate hreflang alternates and canonical URL for multilingual SEO.
 * 
 * @param countryCode - Current country code (e.g., 'uz')
 * @param path - Page path without locale and country code (e.g., '/products/my-product')
 * @param currentLocale - Currently active locale
 * @returns Metadata alternates object
 */
export function generateAlternates(
  countryCode: string,
  path: string,
  currentLocale: string
) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  
  const languages: Record<string, string> = {}
  
  locales.forEach((locale) => {
    // URL structure: /[locale]/[countryCode]/[path]
    languages[locale] = `${BASE_URL}/${locale}/${countryCode}${cleanPath}`
  })

  // Canonical is always self-referencing in this implementation
  const canonical = `${BASE_URL}/${currentLocale}/${countryCode}${cleanPath}`

  return {
    canonical,
    languages,
  }
}
