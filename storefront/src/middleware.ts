import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: ["regions"],
      },
    }).then((res) => res.json())

    if (!regions?.length) {
      notFound()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    // Get URL parts after locale: /[locale]/[countryCode]/...
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean)
    // Skip locale (first part) to get countryCode (second part if it exists)
    // Make sure we don't treat locale as countryCode
    const urlCountryCode = pathParts.length > 1 && !locales.includes(pathParts[1] as any) 
      ? pathParts[1]?.toLowerCase() 
      : undefined

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

// Create next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

/**
 * Middleware to handle locale, region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isOnboarding = searchParams.get("onboarding") === "true"
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const onboardingCookie = request.cookies.get("_medusa_onboarding")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  // First, handle locale with next-intl - this will add locale to URL if missing
  const intlResponse = intlMiddleware(request);
  
  // Check if intlMiddleware is redirecting (adding locale to URL)
  if (intlResponse.headers.get('location')) {
    // Let intl middleware handle the redirect
    return intlResponse;
  }
  
  // At this point, URL should have locale, extract it
  const pathParts = request.nextUrl.pathname.split("/").filter(Boolean)
  const locale = pathParts[0]
  const hasLocale = locales.includes(locale as any)
  
  // If no valid locale found, something is wrong, return intl response
  if (!hasLocale) {
    return intlResponse;
  }
  
  const regionMap = await getRegionMap()
  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  // Check if URL has country code: /[locale]/[countryCode]/...
  const urlCountryCode = pathParts[1]
  const urlHasCountryCode = countryCode && urlCountryCode === countryCode

  // Check authentication for protected account routes
  // Allow /account (login page) but protect /account/* (dashboard pages)
  const isProtectedAccountRoute = request.nextUrl.pathname.includes('/account/') &&
    !request.nextUrl.pathname.includes('/account/@')

  // Hardening: Redirect /login to /account (as login is now handled there)
  if (request.nextUrl.pathname.endsWith('/login')) {
    const url = new URL(request.nextUrl)
    url.pathname = url.pathname.replace(/\/login$/, "/account")
    return NextResponse.redirect(url, 307)
  }
    
  if (isProtectedAccountRoute) {
    const authToken = request.cookies.get('_medusa_jwt')
    
    if (!authToken) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL(request.nextUrl.origin)
      loginUrl.pathname = `/${locale}/${countryCode}/account`
      loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
      
      return NextResponse.redirect(loginUrl.toString(), 307)
    }
  }

  // If everything is in place, continue
  if (
    urlHasCountryCode &&
    (!isOnboarding || onboardingCookie) &&
    (!cartId || cartIdCookie)
  ) {
    return intlResponse
  }

  // Build redirect path
  const redirectPathParts = pathParts.slice(1) // Remove locale
  const redirectPath = redirectPathParts.length > 0 ? `/${redirectPathParts.join("/")}` : ""
  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  let redirectUrl = request.nextUrl.href
  let response = NextResponse.redirect(redirectUrl, 307)

  // Build URL with locale and country code: /[locale]/[countryCode]/...
  if (countryCode && !urlHasCountryCode) {
    const cleanPath = redirectPath.startsWith(`/${countryCode}`) 
      ? redirectPath.slice(countryCode.length + 1) 
      : redirectPath
    redirectUrl = `${request.nextUrl.origin}/${locale}/${countryCode}${cleanPath}${queryString}`
    response = NextResponse.redirect(redirectUrl, 307)
  }

  // If a cart_id is in the params, we set it as a cookie and redirect to the address step.
  if (cartId && !checkoutStep) {
    const url = new URL(response.headers.get('location') || redirectUrl);
    url.searchParams.set('step', 'address');
    response = NextResponse.redirect(url.toString(), 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  // Set a cookie to indicate that we're onboarding. This is used to show the onboarding flow.
  if (isOnboarding) {
    response.cookies.set("_medusa_onboarding", "true", { maxAge: 60 * 60 * 24 })
  }

  return response
}

export const config = {
  matcher: ["/((?!api|health|_next/static|favicon.ico|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.svg).*)"], // prevents redirecting on API/static files and health endpoint
}
