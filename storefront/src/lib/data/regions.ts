import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"

export const listRegions = cache(async function () {
  return sdk.store.region
    .list({}, { next: { tags: ["regions"], revalidate: 30 } })
    .then(({ regions }) => regions)
    .catch(medusaError)
})

export const retrieveRegion = cache(async function (id: string) {
  return sdk.store.region
    .retrieve(id, {}, { next: { tags: ["regions"], revalidate: 30 } })
    .then(({ region }) => region)
    .catch(medusaError)
})

export const getRegion = cache(async function (countryCode: string) {
  const regions = await listRegions()

  if (!regions) {
    return null
  }

  const region = regions.find((region) => 
    region.countries?.some((c) => c?.iso_2 === countryCode)
  )

  if (!region) {
    return regions.find((r) => r.countries?.some((c) => c?.iso_2 === "us")) || regions[0]
  }

  return region
})
