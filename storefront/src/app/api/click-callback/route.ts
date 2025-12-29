import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Click Callback - handles redirect/return after payment.
 *
 * - Redirect flow (services/pay) will come back via return_url with query params.
 * - Pay-by-card (checkout.js) submits a form to action URL and includes a `status` field.
 *
 * After successful payment, the backend Complete callback already creates the order.
 * We redirect to home page with success message since guest users can't access /account/orders.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const clickError = searchParams.get("error")

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ru"
  const countryCode = cookieStore.get("NEXT_COUNTRY")?.value || "uz"

  // Handle explicit errors or cancellations
  if (status === "cancelled" || status === "failed" || status === "error" || (clickError && clickError !== "0")) {
    const redirectUrl = `/${locale}/${countryCode}/cart?payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Success case - redirect to home page with success message
  // Guest users can see the success message, logged-in users can go to their orders
  const redirectUrl = `/${locale}/${countryCode}?payment_success=true`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const status = form?.get("status")?.toString()
  const clickError = form?.get("error")?.toString()

  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ru"
  const countryCode = cookieStore.get("NEXT_COUNTRY")?.value || "uz"

  // Handle explicit errors or cancellations
  if ((status && status !== "success" && status !== "0") || (clickError && clickError !== "0")) {
    const redirectUrl = `/${locale}/${countryCode}/cart?payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Success case - redirect to home page with success message
  const redirectUrl = `/${locale}/${countryCode}?payment_success=true`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}















