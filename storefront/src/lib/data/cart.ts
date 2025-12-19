"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cookies as nextCookies, headers } from "next/headers"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getProductsById } from "./products"
import { getRegion, listRegions } from "./regions"

export async function retrieveCart() {
  const cartId = getCartId()

  if (!cartId) {
    return null
  }

  try {
    const { cart } = await sdk.store.cart
      .retrieve(
        cartId, 
        { 
          // Medusa v2 fields syntax: request relations with `*relation` tokens.
          // Avoid standalone `*` or `relation.*` which can break parsing and lead to:
          // "Entity 'Cart' does not have property ''"
          fields:
            "*region,*items,*items.variant,*items.variant.product,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions",
        }, 
        { next: { tags: ["cart"] }, ...getAuthHeaders() }
      )
    
    // If cart is completed (order was placed), remove the stale cart ID and return null
    // This will trigger creation of a new cart
    if ((cart as any)?.completed_at) {
      removeCartId()
      return null
    }
    
    return cart
  } catch (error: any) {
    // If error mentions "already completed" or cart not found, remove stale cart ID
    const errorMessage = error?.message || error?.toString() || ''
    const removedCartId =
      errorMessage.includes('already completed') || 
      errorMessage.includes('not found') ||
      errorMessage.includes('does not exist')
    if (removedCartId) {
      removeCartId()
    }
    return null
  }
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const cc = (countryCode || "").toLowerCase()
  let region = await getRegion(cc)

  if (!region) {
    // Fallback: pick the first available region so cart operations don't hard-fail
    // when URL params are missing/mis-parsed.
    const regions = await listRegions().catch(() => null)
    region = regions?.[0] || null
  }

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id })
    cart = cartResp.cart
    setCartId(cart.id)
    revalidateTag("cart")
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(
      cart.id,
      { region_id: region.id },
      {},
      getAuthHeaders()
    )
    revalidateTag("cart")
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  return sdk.store.cart
    .update(cartId, data, {}, getAuthHeaders())
    .then(({ cart }) => {
      revalidateTag("cart")
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)
  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, getAuthHeaders())
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
  revalidateTag("cart")
}

export async function enrichLineItems(
  lineItems:
    | HttpTypes.StoreCartLineItem[]
    | HttpTypes.StoreOrderLineItem[]
    | null,
  regionId: string
) {
  if (!lineItems) return []

  // Prepare query parameters
  const queryParams = {
    ids: lineItems.map((lineItem) => lineItem.product_id!),
    regionId: regionId,
  }

  // Fetch products by their IDs
  const products = await getProductsById(queryParams)
  // If there are no line items or products, return an empty array
  if (!lineItems?.length || !products) {
    return []
  }

  // Enrich line items with product and variant information
  const enrichedItems = lineItems.map((item) => {
    const product = products.find((p: any) => p.id === item.product_id)
    const variant = product?.variants?.find(
      (v: any) => v.id === item.variant_id
    )

    // If product or variant is not found, return the original item
    if (!product || !variant) {
      return item
    }

    // If product and variant are found, enrich the item
    return {
      ...item,
      variant: {
        ...variant,
        product: omit(product, "variants"),
      },
    }
  }) as HttpTypes.StoreCartLineItem[]

  return enrichedItems
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  return sdk.store.cart
    .addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      getAuthHeaders()
    )
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  try {
    const resp = await sdk.store.payment
      .initiatePaymentSession(cart, data, {}, getAuthHeaders())
    revalidateTag("cart")
    return resp
  } catch (error: any) {
    console.error("[initiatePaymentSession] Error:", error)
    
    // Extract meaningful error message
    const message = error?.response?.data?.message 
      || error?.message 
      || "Failed to initiate payment session"
    
    throw new Error(message)
  }
}

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found")
  }

  await updateCart({ promo_codes: codes })
    .then(() => {
      revalidateTag("cart")
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const phone = formData.get("shipping_address.phone") as string
    let email = formData.get("email") as string
    
    // Auto-generate email from phone if missing (Uzum Style)
    if (!email && phone) {
      const cleanPhone = phone.replace(/\D/g, "")
      email = `${cleanPhone}@phone.local`
    }

    // Prepare BTS metadata if available
    const btsRegionId = formData.get("bts_region_id") as string
    const btsPointId = formData.get("bts_point_id") as string
    const btsEstimatedCost = formData.get("bts_estimated_cost") as string
    const btsEstimatedCostNum = parseInt(btsEstimatedCost) || 0

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name") || "Покупатель",
        last_name: formData.get("shipping_address.last_name") || "Toolbox",
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company") || "",
        postal_code: formData.get("shipping_address.postal_code") || "100000",
        city: formData.get("shipping_address.city") || "Tashkent",
        country_code: formData.get("shipping_address.country_code") || "uz",
        province: formData.get("shipping_address.province") || "Uzbekistan",
        phone: phone,
      },
      email: email,
    } as any

    const shippingMethodId = formData.get("shipping_method_id") as string

    if (btsRegionId && btsPointId) {
      const { BTS_REGIONS } = await import("./bts")
      const region = BTS_REGIONS.find(r => r.id === btsRegionId)
      const point = region?.points.find(p => p.id === btsPointId)
      
      data.metadata = {
        bts_delivery: {
          region: region?.nameRu,
          region_id: btsRegionId,
          point: point?.name,
          point_address: point?.address,
          estimated_cost: btsEstimatedCostNum
        }
      }
    }

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on" || !formData.get("billing_address.first_name")) {
      data.billing_address = data.shipping_address
    } else {
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    }

    await updateCart(data)
    
    // Set shipping method if provided
    if (shippingMethodId) {
      try {
        await setShippingMethod({ cartId, shippingMethodId })
      } catch (e: any) {
        const msg = e?.message || ""
        // If the selected shipping option has no price configured in Medusa,
        // attach it via a custom backend endpoint using the BTS estimated cost.
        if (
          msg.toLowerCase().includes("do not have a price") ||
          msg.toLowerCase().includes("does not have a price")
        ) {
          const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
          const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
          const resp = await fetch(`${backendUrl}/store/bts/shipping-method`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-publishable-api-key": publishableKey,
            },
            body: JSON.stringify({
              cart_id: cartId,
              shipping_option_id: shippingMethodId,
              amount: btsEstimatedCostNum,
            }),
            cache: "no-store",
          })
          
          if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}))
            throw new Error(errorData.message || "Failed to set BTS shipping method")
          }
          
          // Invalidate cart cache so Payment component sees the shipping method
          revalidateTag("cart")
        } else {
          throw e
        }
      }
    }
    
    // Redirect straight to payment as address and delivery are now unified in Step 1.
    // Preserve locale + countryCode segments from the current checkout URL.
    const hdrs = await headers()
    const referer = hdrs.get("referer")

    if (referer) {
      try {
        const refUrl = new URL(referer)

        // Only trust referer when it points to checkout page; otherwise fallback.
        if (refUrl.pathname.includes("/checkout")) {
          refUrl.searchParams.set("step", "payment")
          redirect(`${refUrl.pathname}?${refUrl.searchParams.toString()}`)
        }
      } catch {
        // ignore
      }
    }

    const cookieStore = await nextCookies()
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "ru"
    const countryCode =
      (data.shipping_address.country_code as string | undefined)?.toLowerCase() || "uz"

    redirect(`/${locale}/${countryCode}/checkout?step=payment`)
    
  } catch (e: any) {
    if (e.message.includes("NEXT_REDIRECT")) {
        throw e
    }
    return e.message
  }
}

export async function placeOrder() {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("No existing cart found when placing an order")
  }

  // Get cart data for auto-registration
  const cart = await retrieveCart()
  if (!cart) {
    throw new Error("Cart not found")
  }

  // Check if user is authenticated
  const authHeaders = getAuthHeaders()
  const isAuthenticated = 'authorization' in authHeaders && authHeaders.authorization

  // If not authenticated and cart has phone, auto-register
  if (!isAuthenticated && cart.shipping_address?.phone) {
    const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
    
    try {
      const resp = await fetch(`${backendUrl}/store/auto-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cart.shipping_address.phone,
          first_name: cart.shipping_address.first_name,
          last_name: cart.shipping_address.last_name,
        }),
        cache: "no-store",
      })

      if (resp.ok) {
        const data = await resp.json()
        if (data.token) {
          // Import setAuthToken dynamically to avoid circular deps
          const { setAuthToken } = await import("./cookies")
          setAuthToken(data.token)
          revalidateTag("customer")
        }
      }
      // If auto-register fails (e.g., customer exists), continue with order
    } catch (e) {
      // Silent fail - user can still place order as guest
      console.error("[placeOrder] auto-register failed:", e)
    }
  }

  const cartRes = await sdk.store.cart
    .complete(cartId, {}, getAuthHeaders())
    .then((cartRes) => {
      revalidateTag("cart")
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()
    removeCartId()
    redirect(`/${countryCode}/order/confirmed/${cartRes?.order.id}`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    revalidateTag("cart")
  }

  revalidateTag("regions")
  revalidateTag("products")

  redirect(`/${countryCode}${currentPath}`)
}
