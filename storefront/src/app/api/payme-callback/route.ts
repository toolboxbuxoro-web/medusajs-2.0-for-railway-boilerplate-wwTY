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
  
  console.log('[payme-callback] Full URL:', request.url)
  console.log('[payme-callback] Method:', request.method)
  console.log('[payme-callback] All search params:', Object.fromEntries(searchParams.entries()))
  
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
  const countryCode = 'uz'
  
  console.log('[payme-callback] Received callback:', { 
    orderId, 
    status, 
    locale,
    cookies: cookieStore.getAll().map(c => c.name)
  })
  
  // Construct the base URL from the request origin
  const host = headersList.get('host') || 'toolbox-tools.uz'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = request.nextUrl.origin || `${protocol}://${host}`
  
  // If payment was explicitly cancelled
  if (status === 'cancelled' || status === 'failed') {
    const redirectUrl = `${baseUrl}/${locale}/${countryCode}/checkout?step=review&payment_error=cancelled`
    console.log('[payme-callback] Redirecting to (cancelled):', redirectUrl)
    return NextResponse.redirect(redirectUrl)
  }
  
  // For successful or pending payments, redirect to review step with payment=success
  // The PaymePaymentButton will check the actual payment status
  const redirectUrl = `${baseUrl}/${locale}/${countryCode}/checkout?step=review&payment_status=checking`
  
  console.log('[payme-callback] Redirecting to:', redirectUrl)
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
