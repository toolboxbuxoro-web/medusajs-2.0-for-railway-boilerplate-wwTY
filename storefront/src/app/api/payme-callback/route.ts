import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Payme Callback - простой редирект на checkout после оплаты
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ru'
  const countryCode = 'uz'
  
  // Простой редирект на review step
  const redirectUrl = `/${locale}/${countryCode}/checkout?step=review`
  
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}
