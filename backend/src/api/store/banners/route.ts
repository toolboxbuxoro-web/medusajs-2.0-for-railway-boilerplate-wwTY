import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

type Banner = {
  id: string
  file_id?: string
  image_url?: string
  href?: string
  title?: string
  subtitle?: string
  description?: string
  cta?: string
  title_uz?: string
  subtitle_uz?: string
  description_uz?: string
  cta_uz?: string
  order?: number
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters: {},
      take: 1,
      skip: 0,
    },
    fields: ["id", "metadata"],
  })

  const { rows } = await remoteQuery(queryObject)
  const store = rows?.[0]

  const metadata = store?.metadata
  const parsedMeta =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata)
          } catch {
            return {}
          }
        })()
      : metadata || {}

  const bannersRaw = (parsedMeta as any)?.banners
  const banners: Banner[] = Array.isArray(bannersRaw) ? bannersRaw : []

  banners.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))

  res.json({
    banners,
  })
}




