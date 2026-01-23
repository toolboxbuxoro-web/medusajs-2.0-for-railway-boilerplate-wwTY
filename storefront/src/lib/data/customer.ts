"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"

type OtpPurpose = "register" | "checkout" | "change_phone"

function normalizeUzPhone(input: string): string | null {
  if (!input) return null
  const digits = input.replace(/\D/g, "")
  if (digits.startsWith("998") && digits.length === 12) return digits
  if (digits.length === 9) return `998${digits}`
  if (digits.length === 10 && digits.startsWith("0")) return `998${digits.slice(1)}`
  return null
}

function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
}

/**
 * Maps technical backend errors to frontend translation keys (auth.errors.*)
 */
function mapBackendError(error: any): string {
  const message = (error?.message || error?.toString() || "").toLowerCase()
  if (message.includes("account_exists")) return "account_exists"
  if (message.includes("otp_cooldown")) return "otp_cooldown"
  if (message.includes("failed_to_send_otp")) return "failed_to_send_otp"
  if (message.includes("invalid_code")) return "invalid_code"
  if (message.includes("too_many_requests")) return "too_many_requests"
  if (message.includes("phone_not_verified")) return "phone_not_verified"
  if (message.includes("invalid_phone")) return "invalid_phone"
  return "error_occurred"
}

async function otpRequest(phone: string, purpose: OtpPurpose) {
  const resp = await fetch(`${backendBaseUrl()}/store/otp/request`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    },
    body: JSON.stringify({ phone, purpose }),
    cache: "no-store",
  })
  if (!resp.ok) {
    const errorJson = await resp.json().catch(() => ({}))
    throw new Error(errorJson.error || "failed_to_send_otp")
  }
}

async function otpVerify(phone: string, purpose: OtpPurpose, code: string) {
  const resp = await fetch(`${backendBaseUrl()}/store/otp/verify`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    },
    body: JSON.stringify({ phone, purpose, code }),
    cache: "no-store",
  })
  if (!resp.ok) {
    const errorJson = await resp.json().catch(() => ({}))
    throw new Error(errorJson.error || "invalid_code")
  }
  const json = await resp.json().catch(() => null)
  return !!json?.verified
}

export const getCustomer = cache(async function () {
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...await getAuthHeaders() })
    .then(({ customer }) => customer)
    .catch(() => null)
})

/**
 * Client-friendly session verification
 */
export async function verifySession(): Promise<HttpTypes.StoreCustomer | null> {
  return await getCustomer()
}

/**
 * OTP Login: Set JWT token received from /store/mobile/auth/verify-otp
 * This is a server action that sets the httpOnly cookie and returns success/error
 */
export async function loginWithOtpToken(token: string): Promise<string> {
  if (!token) {
    return "invalid_token"
  }

  try {
    await setAuthToken(token)
    revalidateTag("customer")
    return "success"
  } catch (error: any) {
    console.error("[loginWithOtpToken] Error setting auth token:", error)
    return "error_occurred"
  }
}

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, await getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})



export async function changePhoneWithOtp(_currentState: any, formData: FormData) {
  const phone = (formData.get("phone") as string) || ""
  const code = (formData.get("otp_code") as string) || ""

  const normalized = normalizeUzPhone(phone)
  if (!normalized) return "invalid_phone"

  try {
    // If no code, just send OTP
    if (!code) {
      await otpRequest(normalized, "change_phone")
      return "otp_sent"
    }

    const resp = await fetch(`${backendBaseUrl()}/store/otp/change-phone`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      },
      body: JSON.stringify({
        phone: normalized,
        code
      }),
      cache: "no-store",
    })

    if (!resp.ok) {
      const errorJson = await resp.json().catch(() => ({}))
      return mapBackendError(errorJson.error || "phone_change_failed")
    }

    revalidateTag("customer")
    return "success.phone_changed"
  } catch (e: any) {
    return mapBackendError(e)
  }
}



export async function signout(countryCode: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  revalidateTag("auth")
  revalidateTag("customer")
  redirect(`/${countryCode}/account`)
}

export const addCustomerAddress = async (
  _currentState: unknown,
  formData: FormData
): Promise<any> => {
  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .createAddress(address, {}, await getAuthHeaders())
    .then(({ customer }) => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, await getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId = currentState.addressId as string

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, await getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
