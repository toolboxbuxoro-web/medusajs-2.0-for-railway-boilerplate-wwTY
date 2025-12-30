import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

console.log(`[DIAGNOSTIC] Build Timestamp: ${new Date().toISOString()}`)
console.log(`[DIAGNOSTIC] Backend URL: ${MEDUSA_BACKEND_URL}`)
const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
console.log(`[DIAGNOSTIC] API Key (Prefix): ${pk.slice(0, 8)}...${pk.slice(-4)}`)

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: pk,
})
