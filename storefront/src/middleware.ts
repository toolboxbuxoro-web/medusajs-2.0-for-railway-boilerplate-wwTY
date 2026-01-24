import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { getMedusaHeaders } from "@lib/util/get-medusa-headers";

/**
 * IMPORTANT MIDDLEWARE POLICY:
 * 
 * ❌ NEVER throw errors in middleware
 * ❌ NEVER call notFound() in middleware
 * ❌ NEVER block requests due to backend failures
 * 
 * ✅ Middleware MUST be resilient to backend failures
 * ✅ Always use graceful degradation (fallback values)
 * ✅ Log warnings but continue processing
 * 
 * Rationale:
 * - Middleware runs before routing, so errors here affect ALL pages
 * - Backend failures should not break the entire storefront
 * - Users should be able to browse even if backend is temporarily unavailable
 * - Errors in middleware manifest as 404, making debugging difficult
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "uz"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

/**
 * Safely fetches regions from Medusa backend with error handling.
 * Returns null if fetch fails or regions are unavailable.
 * NEVER calls notFound() - this allows graceful degradation.
 */
async function getRegionMap(): Promise<Map<string, HttpTypes.StoreRegion> | null> {
  // Check if BACKEND_URL is configured
  if (!BACKEND_URL) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Middleware] NEXT_PUBLIC_MEDUSA_BACKEND_URL is not set. Skipping region fetch.")
    }
    return null
  }

  const { regionMap, regionMapUpdated } = regionMapCache

  // Use cached map if it exists and is fresh (< 1 hour)
  if (
    regionMap.keys().next().value &&
    regionMapUpdated > Date.now() - 3600 * 1000
  ) {
    return regionMap
  }

  try {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    // Create abort controller for timeout (Edge Runtime compatible)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
    
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: getMedusaHeaders(),
        next: {
          revalidate: 3600,
          tags: ["regions"],
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      // Check if response is OK
      if (!response.ok) {
        console.warn(
          `[Middleware] Backend returned ${response.status} for /store/regions. Using fallback.`
        )
        return null
      }

      const data = await response.json()
      const regions = data?.regions

      // Validate regions data
      if (!regions || !Array.isArray(regions) || regions.length === 0) {
        console.warn("[Middleware] No regions found in backend response. Using fallback.")
        return null
      }

      // Clear existing cache
      regionMapCache.regionMap.clear()

      // Create a map of country codes to regions.
      regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          if (c?.iso_2) {
            regionMapCache.regionMap.set(c.iso_2.toLowerCase(), region)
          }
        })
      })

      regionMapCache.regionMapUpdated = Date.now()

      // Return the updated map
      return regionMapCache.regionMap
    } catch (fetchError: any) {
      // Clear timeout if fetch was aborted or failed
      clearTimeout(timeoutId)
      throw fetchError // Re-throw to outer catch
    }
  } catch (error: any) {
    // Log error but don't fail - allow graceful degradation
    const errorMessage = error?.message || "Unknown error"
    const errorName = error?.name || "Error"
    
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[Middleware] Failed to fetch regions from backend: ${errorName} - ${errorMessage}. Using fallback.`
      )
    }
    
    // Return null to indicate regions are unavailable
    // This allows middleware to continue with fallback logic
    return null
  }
}

/**
 * Safely determines country code from request and region map.
 * Returns fallback country code if regions are unavailable.
 * @param request
 * @param regionMap - Can be null if regions fetch failed
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion> | null
): Promise<string> {
  try {
    // If regionMap is null (backend unavailable), use fallback
    if (!regionMap || regionMap.size === 0) {
      return DEFAULT_REGION
    }

    let countryCode: string | undefined

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    // Get URL parts after locale: /[locale]/[countryCode]/...
    const pathParts = request.nextUrl.pathname.split("/").filter(Boolean)
    // Skip locale (first part) to get countryCode (second part if it exists)
    const urlCountryCode = pathParts.length > 1 ? pathParts[1]?.toLowerCase() : undefined

    // Priority: URL > Vercel header > Default > First available
    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION
    } else {
      // Use first available region as fallback
      const firstRegion = regionMap.keys().next().value
      countryCode = firstRegion || DEFAULT_REGION
    }

    // Ensure we always return a valid country code
    return countryCode || DEFAULT_REGION
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Middleware] Error getting country code. Using fallback:",
        error
      )
    }
    // Always return fallback on error
    return DEFAULT_REGION
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
  
  // Safely fetch region map (may return null if backend unavailable)
  const regionMap = await getRegionMap()
  
  // Minimal prod-safe diagnostics (no stack traces, no noise)
  // Detailed warnings are already logged in getRegionMap() for development
  // In production, we silently use fallback to avoid log spam
  
  // Get country code with fallback (always returns a valid string)
  const countryCode = await getCountryCode(request, regionMap)

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
      // countryCode is guaranteed to be defined (getCountryCode always returns a string)
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
  // countryCode is guaranteed to be defined (getCountryCode always returns a string)
  if (!urlHasCountryCode) {
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

/**
 * FUTURE ARCHITECTURE RECOMMENDATION:
 * 
 * Consider moving region fetching out of middleware:
 * 
 * Current (works but not ideal):
 * - Middleware fetches regions from backend
 * - Adds latency to every request
 * - Risk of failures affecting all pages
 * 
 * Better approach:
 * - Middleware: Only handle locale parsing (next-intl)
 * - Regions: Fetch in layout.tsx or RSC components
 * - Benefits:
 *   - Faster middleware (no network calls)
 *   - Errors isolated to specific pages
 *   - Better error boundaries
 *   - Easier to cache and optimize
 * 
 * Example future structure:
 * - middleware.ts: Only locale redirects
 * - app/[locale]/layout.tsx: Fetch regions, pass via context
 * - Components: Use region context instead of middleware logic
 */
