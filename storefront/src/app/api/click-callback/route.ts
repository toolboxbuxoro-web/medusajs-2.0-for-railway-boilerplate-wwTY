import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Click Callback - handles redirect/return after payment.
 *
 * - Redirect flow (services/pay) will come back via return_url with query params.
 * - Pay-by-card (checkout.js) submits a form to action URL and includes a `status` field.
 *
 * We don't trust this status for payment confirmation; we only use it to show UX.
 * Real confirmation happens via Click Prepare/Complete callbacks to backend,
 * and storefront polls /api/check-payment.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ru"
  const countryCode = "uz"

  if (status === "cancelled" || status === "failed" || status === "error") {
    const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_status=checking`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const status = form?.get("status")?.toString()

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ru"
  const countryCode = "uz"

  if (status && status !== "success" && status !== "0") {
    const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  const redirectUrl = `/${locale}/${countryCode}/checkout?step=review&payment_status=checking`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}



