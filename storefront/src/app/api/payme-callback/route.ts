import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Payme Callback Route
 * 
 * This route handles the redirect from Payme after payment.
 * It redirects the user to the checkout page with the correct locale.
 * 
 * Payme redirects to: /api/payme-callback
 * We redirect to: /[locale]/[countryCode]/checkout?step=payment
 */
export async function GET(request: NextRequest) {
  // Get locale from cookie or use default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  const locale = localeCookie?.value || 'ru'
  
  // Default country code for Uzbekistan
  const countryCode = 'uz'
  
  // Redirect to checkout with payment step
  const redirectUrl = `/${locale}/${countryCode}/checkout?step=payment`
  
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}
