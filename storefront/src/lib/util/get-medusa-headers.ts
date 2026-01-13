export const getMedusaHeaders = () => {
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (pk) {
    headers["x-publishable-api-key"] = pk
  } else {
    console.warn("[getMedusaHeaders] Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  }

  return headers
}
