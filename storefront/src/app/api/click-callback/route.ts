import { NextRequest, NextResponse } from "next/server"
import { cookies, headers } from "next/headers"

/**
 * Click Callback - handles redirect/return after payment.
 *
 * - Redirect flow (services/pay) will come back via return_url with query params.
 * - Pay-by-card (checkout.js) submits a form to action URL and includes a `status` field.
 *
 * After successful payment, the backend Complete callback already creates the order.
 * We now resolve the Medusa order id and redirect to /order/confirmed/:id,
 * similar to the Payme flow, so the user lands on a proper success page.
 */
async function resolveLocaleAndCountry(request: NextRequest) {
  const cookieStore = await cookies()
  const headersList = await headers()

  let locale = cookieStore.get("NEXT_LOCALE")?.value

  // Fallback: check referer path /:locale/:countryCode/...
  if (!locale) {
    const referer = headersList.get("referer")
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const pathParts = refererUrl.pathname.split("/").filter(Boolean)
        if (pathParts[0] && ["ru", "uz", "en"].includes(pathParts[0])) {
          locale = pathParts[0]
        }
      } catch {
        // ignore
      }
    }
  }

  if (!locale) {
    const acceptLang = headersList.get("accept-language")
    if (acceptLang?.includes("ru")) {
      locale = "ru"
    } else if (acceptLang?.includes("uz")) {
      locale = "uz"
    }
  }

  locale = locale || "ru"

  // Infer countryCode from referer path
  let countryCode = "uz"
  const referer = headersList.get("referer")
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const pathParts = refererUrl.pathname.split("/").filter(Boolean)
      if (pathParts[0] && ["ru", "uz", "en"].includes(pathParts[0]) && pathParts[1]) {
        countryCode = pathParts[1].toLowerCase()
      }
    } catch {
      // ignore
    }
  }

  return { locale, countryCode }
}

async function handleClickCallback(
  request: NextRequest,
  opts: { status?: string | null; error?: string | null; cartId?: string | null }
) {
  const { status, error: clickError, cartId } = opts
  const { locale, countryCode } = await resolveLocaleAndCountry(request)

  // Handle explicit errors or cancellations
  if (
    status === "cancelled" ||
    status === "failed" ||
    status === "error" ||
    (clickError && clickError !== "0")
  ) {
    const redirectUrl = `/${locale}/${countryCode}/cart?payment_error=cancelled`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // If we don't have cartId, fall back to home with a generic success flag
  if (!cartId) {
    const redirectUrl = `/${locale}/${countryCode}?payment_success=true`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Construct backend lookup URL similar to Payme flow
  const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const lookupUrl = `${backendUrl}/store/click/order?cart_id=${encodeURIComponent(cartId)}`

  let resolvedOrderId: string | null = null

  // Short polling window to handle race between Click completion and order persistence
  for (let i = 0; i < 60; i++) {
    try {
      const resp = await fetch(lookupUrl, {
        cache: "no-store",
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
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
    const redirectUrl = `/${locale}/${countryCode}/order/confirmed/${resolvedOrderId}`
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Fallback: cart with "checking" status so frontend can poll if needed
  const redirectUrl = `/${locale}/${countryCode}/cart?payment_status=checking&cart_id=${encodeURIComponent(
    cartId
  )}`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const clickError = searchParams.get("error")
  // Click sends merchant_trans_id which we use as cart_id
  const merchantTransId = searchParams.get("merchant_trans_id")

  return handleClickCallback(request, {
    status,
    error: clickError,
    cartId: merchantTransId,
  })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const status = form?.get("status")?.toString()
  const clickError = form?.get("error")?.toString()
  // For pay-by-card flow Click can also send merchant_trans_id in the form
  const merchantTransId = form?.get("merchant_trans_id")?.toString() || form?.get("merchant_trans_id".toUpperCase())?.toString() || null

  return handleClickCallback(request, {
    status,
    error: clickError,
    cartId: merchantTransId,
  })
}

















