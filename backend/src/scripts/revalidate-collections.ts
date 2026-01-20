import { ExecArgs } from "@medusajs/framework/types"

const STOREFRONT_URL =
  process.env.STOREFRONT_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:8000"

const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || ""

async function revalidateCollections() {
  const trimmedBaseUrl = STOREFRONT_URL.replace(/\/+$/, "")
  const url = `${trimmedBaseUrl}/api/revalidate`

  if (!REVALIDATION_SECRET) {
    console.error(
      "[Revalidate Collections] REVALIDATION_SECRET is not set. Skipping request."
    )
    return
  }

  console.log(
    `[Revalidate Collections] Sending revalidation request to ${url} for tags: collections`
  )

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATION_SECRET,
      },
      body: JSON.stringify({ tags: ["collections"] }),
    })

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      console.log("[Revalidate Collections] Success:", data)
    } else {
      const errorText = await response.text().catch(() => "")
      console.error(
        `[Revalidate Collections] Failed: ${response.status} ${response.statusText}`,
        errorText
      )
    }
  } catch (error) {
    console.error(
      "[Revalidate Collections] Error:",
      error instanceof Error ? error.message : error
    )
  }
}

export default async function revalidateCollectionsScript(_: ExecArgs) {
  await revalidateCollections()
}

