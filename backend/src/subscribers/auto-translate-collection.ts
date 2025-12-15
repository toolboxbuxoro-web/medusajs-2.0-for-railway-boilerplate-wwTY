import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { translateText } from "../lib/translation-service"

export default async function autoTranslateCollection({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  const collections = await (productService as any).listProductCollections({ id: data.id })
  const collection = collections?.[0]
  if (!collection) {
    return
  }

  let needsUpdate = false
  const metadata = collection.metadata || {}

  const titleManual = metadata.title_uz_manual === true

  if (collection.title && !titleManual) {
    const titleSrc = metadata.title_uz_src as string | undefined
    const shouldTranslateTitle = !metadata.title_uz || titleSrc !== collection.title

    if (shouldTranslateTitle) {
      const translatedTitle = await translateText(collection.title, "uz")
      if (translatedTitle) {
        metadata.title_uz = translatedTitle
        metadata.title_uz_src = collection.title
        needsUpdate = true
      }
    }
  }

  if (needsUpdate) {
    await (productService as any).updateProductCollections({ id: collection.id }, { metadata })
    console.log(`[AutoTranslate] Translated collection ${collection.id} to Uzbek`)
  }
}

export const config: SubscriberConfig = {
  event: ["product-collection.created", "product-collection.updated"],
}


