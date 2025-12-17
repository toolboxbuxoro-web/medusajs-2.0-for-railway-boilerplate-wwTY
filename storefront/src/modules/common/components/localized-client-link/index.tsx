"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"
import { locales } from "../../../../i18n"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  locale: propLocale, // Allow overriding locale
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  passHref?: true
  [x: string]: any
}) => {
  const params = useParams()
  const countryCode = params.countryCode as string
  const currentLocale = params.locale as string
  
  const targetLocale = propLocale || currentLocale

  // If the href is an absolute URL (http/https), return as is
  if (href.startsWith("http")) {
    return (
      <a href={href} {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  // Helper to ensure path starts with /
  const path = href.startsWith("/") ? href : `/${href}`

  // Logic to determine if we need to prepend locale/countryCode
  let finalHref = path

  // Check if path already starts with a locale
  const pathParts = path.split("/").filter(Boolean)
  const firstPart = pathParts[0]
  const secondPart = pathParts[1]

  const hasLocale = locales.includes(firstPart as any)
  const hasCountryCode = secondPart && secondPart.length === 2 // Simplified check, ideally check against known regions

  if (hasLocale) {
    // If it has locale, we assume it's a full path or we trust it. 
    // Usually we shouldn't pass localized paths to this component, but if we do, we assume it's intentional.
    // However, if we want to force the *current* countryCode, we might need to verify.
    // For now, let's keep it simple: if it looks localized, leave it alone OR replace if needed.
    // But the safer bet for this component is: "I will add context IF missing"
    finalHref = path
  } else {
    // Missing locale, prepend targetLocale and countryCode
    finalHref = `/${targetLocale}/${countryCode}${path}`
  }

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
