"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import { getAuthHeaders, removeAuthToken, setAuthToken } from "./cookies"

type OtpPurpose = "register" | "reset_password" | "change_password"

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
    throw new Error(await resp.text().catch(() => "Failed to send code"))
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
  if (!resp.ok) return false
  const json = await resp.json().catch(() => null)
  return !!json?.verified
}

export const getCustomer = cache(async function () {
  return await sdk.store.customer
    .retrieve({}, { next: { tags: ["customer"] }, ...getAuthHeaders() })
    .then(({ customer }) => customer)
    .catch(() => null)
})

export const updateCustomer = cache(async function (
  body: HttpTypes.StoreUpdateCustomer
) {
  const updateRes = await sdk.store.customer
    .update(body, {}, getAuthHeaders())
    .then(({ customer }) => customer)
    .catch(medusaError)

  revalidateTag("customer")
  return updateRes
})

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const otpCode = (formData.get("otp_code") as string) || ""
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    // Require phone for SMS verification
    const normalizedPhone = normalizeUzPhone(customerForm.phone)
    if (!normalizedPhone) {
      return "invalid_phone"
    }

    // Step 1: send OTP if not provided
    if (!otpCode) {
      await otpRequest(normalizedPhone, "register")
      return "otp_sent_info"
    }

    // Step 2: verify OTP
    const verified = await otpVerify(normalizedPhone, "register", otpCode)
    if (!verified) {
      return "invalid_code"
    }

    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const customHeaders = { authorization: `Bearer ${token}` }
    
    const { customer: createdCustomer } = await sdk.store.customer.create(
      { ...customerForm, phone: `+${normalizedPhone}` },
      {},
      customHeaders
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    setAuthToken(typeof loginToken === 'string' ? loginToken : loginToken.location)

    revalidateTag("customer")
    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function requestPasswordResetOtp(_currentState: unknown, formData: FormData) {
  const phone = (formData.get("phone") as string) || ""
  const normalized = normalizeUzPhone(phone)
  if (!normalized) return "invalid_phone"
  try {
    await otpRequest(normalized, "reset_password")
    return "otp_sent"
  } catch (e: any) {
    return e?.message || "Ошибка отправки кода"
  }
}

export async function resetPasswordWithOtp(_currentState: unknown, formData: FormData) {
  const phone = (formData.get("phone") as string) || ""
  const code = (formData.get("otp_code") as string) || ""
  const newPassword = (formData.get("new_password") as string) || ""
  const normalized = normalizeUzPhone(phone)
  if (!normalized) return "Введите корректный номер телефона (+998...)"
  if (!code || !newPassword) return "Введите код и новый пароль"

  const resp = await fetch(`${backendBaseUrl()}/store/otp/reset-password`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    },
    body: JSON.stringify({ phone: normalized, code, new_password: newPassword }),
    cache: "no-store",
  })

  if (!resp.ok) {
    return "Не удалось сбросить пароль"
  }

  return "Пароль обновлён. Теперь войдите с новым паролем."
}

export async function forgotPassword(_currentState: unknown, formData: FormData) {
  const code = (formData.get("otp_code") as string) || ""
  if (!code) {
    return requestPasswordResetOtp(_currentState, formData)
  }
  return resetPasswordWithOtp(_currentState, formData)
}

export async function changePasswordWithOtp(_currentState: any, formData: FormData) {
  const phone = (formData.get("phone") as string) || ""
  const code = (formData.get("otp_code") as string) || ""
  const oldPassword = (formData.get("old_password") as string) || ""
  const newPassword = (formData.get("new_password") as string) || ""

  const normalized = normalizeUzPhone(phone)
  if (!normalized) return "Укажите корректный номер телефона в профиле"

  // If no code, just send OTP
  if (!code) {
    await otpRequest(normalized, "change_password")
    return "Код отправлен по SMS"
  }

  const resp = await fetch(`${backendBaseUrl()}/store/otp/change-password`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    },
    body: JSON.stringify({
      phone: normalized,
      code,
      old_password: oldPassword,
      new_password: newPassword,
    }),
    cache: "no-store",
  })

  if (!resp.ok) {
    return "Не удалось изменить пароль"
  }

  return "Пароль изменён"
}

export async function login(_currentState: unknown, formData: FormData) {
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string

  // Normalize phone and convert to email format
  const normalized = normalizeUzPhone(phone)
  if (!normalized) {
    return "invalid_phone"
  }
  const email = `${normalized}@phone.local`

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then((token) => {
        setAuthToken(typeof token === 'string' ? token : token.location)
        revalidateTag("customer")
      })
  } catch (error: any) {
    return "Неверный номер телефона или пароль"
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  removeAuthToken()
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
    .createAddress(address, {}, getAuthHeaders())
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
    .deleteAddress(addressId, getAuthHeaders())
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
    .updateAddress(addressId, address, {}, getAuthHeaders())
    .then(() => {
      revalidateTag("customer")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
