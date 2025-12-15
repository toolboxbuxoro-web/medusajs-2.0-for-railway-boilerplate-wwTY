import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Payme Callback - handles redirect after payment
 * 
 * Payme can send query params:
 * - order_id: cart ID (what we sent to Payme)
 * - transaction: Payme transaction ID
 * - status: success/cancelled (custom param we can configure)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get('order_id')
  const status = searchParams.get('status')
  
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ru'
  const countryCode = 'uz'
  
  console.log('[payme-callback] Received callback:', { orderId, status })
  
  // If payment was explicitly cancelled
  if (status === 'cancelled' || status === 'failed') {
    const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
  
  // For successful or pending payments, redirect to review step with payment=success
  // The PaymePaymentButton will check the actual payment status
  const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_status=checking`
  
  console.log('[payme-callback] Redirecting to:', redirectUrl)
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}
