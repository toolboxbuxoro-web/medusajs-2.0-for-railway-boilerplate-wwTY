import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

/**
 * Payme Callback - handles redirect after payment
 * 
 * Payme can send query params:
 * - order_id: cart ID (what we sent to Payme)
 * - transaction: Payme transaction ID
 * - status: success/cancelled (custom param we can configure)
 */

async function handleCallback(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get('order_id')
  const status = searchParams.get('status')
  
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Try to get locale from multiple sources
  let locale = cookieStore.get('NEXT_LOCALE')?.value
  
  // Fallback: check referer header for locale
  if (!locale) {
    const referer = headersList.get('referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const pathParts = refererUrl.pathname.split('/').filter(Boolean)
        if (pathParts[0] && ['ru', 'uz', 'en'].includes(pathParts[0])) {
          locale = pathParts[0]
        }
      } catch (e) {
        // Ignore URL parse errors
      }
    }
  }
  
  // Fallback: check Accept-Language header
  if (!locale) {
    const acceptLang = headersList.get('accept-language')
    if (acceptLang?.includes('ru')) {
      locale = 'ru'
    } else if (acceptLang?.includes('uz')) {
      locale = 'uz'
    }
  }
  
  // Default fallback
  locale = locale || 'ru'

  // Try to infer countryCode from referer path: /:locale/:countryCode/...
  let countryCode = 'uz'
  const referer = headersList.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const pathParts = refererUrl.pathname.split('/').filter(Boolean)
      if (pathParts[0] && ['ru', 'uz', 'en'].includes(pathParts[0]) && pathParts[1]) {
        countryCode = pathParts[1].toLowerCase()
      }
    } catch {
      // ignore
    }
  }
  
  // Construct the base URL from the request origin
  const host = headersList.get('host') || 'toolbox-tools.uz'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = request.nextUrl.origin || `${protocol}://${host}`
  
  // If payment was explicitly cancelled
  if (status === 'cancelled' || status === 'failed') {
    const redirectUrl = `${baseUrl}/${locale}/${countryCode}/cart?payment_error=cancelled`
    return NextResponse.redirect(redirectUrl)
  }

  if (!orderId) {
    const redirectUrl = `${baseUrl}/${locale}/${countryCode}/cart?payment_error=missing_order_id`
    return NextResponse.redirect(redirectUrl)
  }

  // For successful payments, redirect to order confirmed page.
  // We resolve Medusa order id via backend lookup endpoint which reads payment_session.data.medusa_order_id.
  const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const lookupUrl = `${backendUrl}/store/payme/order?cart_id=${encodeURIComponent(orderId)}`

  let resolvedOrderId: string | null = null

  // Short polling window to handle race between Payme return redirect and order persistence.
  for (let i = 0; i < 12; i++) {
    try {
      const resp = await fetch(lookupUrl, { 
        cache: "no-store",
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        }
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data?.order_id) {
          resolvedOrderId = data.order_id
          break
        }
      }
    } catch {
      // ignore
    }

    await new Promise((r) => setTimeout(r, 500))
  }

  if (resolvedOrderId) {
    const redirectUrl = `${baseUrl}/${locale}/${countryCode}/order/confirmed/${resolvedOrderId}`
    return NextResponse.redirect(redirectUrl)
  }

  // Fallback: send user to cart with a "checking" status.
  const redirectUrl = `${baseUrl}/${locale}/${countryCode}/cart?payment_status=checking&cart_id=${encodeURIComponent(orderId)}`
  return NextResponse.redirect(redirectUrl)
}

// Handle GET requests (standard redirect)
export async function GET(request: NextRequest) {
  return handleCallback(request)
}

// Handle POST requests (Payme may use POST)
export async function POST(request: NextRequest) {
  return handleCallback(request)
}
