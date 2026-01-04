import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { translateText } from "../lib/translation-service"

export default async function autoTranslateProduct({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  const product = await productService.retrieveProduct(data.id)

  let needsUpdate = false;
  const metadata = product.metadata || {};

  // Avoid infinite loops:
  // - we store the RU source text in *_uz_src
  // - on the next subscriber run, src will match and no update will happen
  //
  // Manual override:
  // - if *_uz_manual is true, we never overwrite the translation automatically
  const titleManual = metadata.title_uz_manual === true
  const descManual = metadata.description_uz_manual === true

  if (product.title && !titleManual) {
    const titleSrc = metadata.title_uz_src as string | undefined
    const shouldTranslateTitle = !metadata.title_uz || titleSrc !== product.title

    if (shouldTranslateTitle) {
      const translatedTitle = await translateText(product.title, "uz")
      if (translatedTitle) {
        metadata.title_uz = translatedTitle
        metadata.title_uz_src = product.title
        needsUpdate = true
      }
    }
  }

  // If RU description was removed, clear auto translation (unless manual)
  if (!product.description && !descManual && (metadata.description_uz || metadata.description_uz_src)) {
    metadata.description_uz = null
    metadata.description_uz_src = null
    needsUpdate = true
  }

  if (product.description && !descManual) {
    const descSrc = metadata.description_uz_src as string | undefined
    const shouldTranslateDesc = !metadata.description_uz || descSrc !== product.description

    if (shouldTranslateDesc) {
      const translatedDescription = await translateText(product.description, "uz")
      if (translatedDescription) {
        metadata.description_uz = translatedDescription
        metadata.description_uz_src = product.description
        needsUpdate = true
      }
    }
  }

  if (needsUpdate) {
    await productService.updateProducts(product.id, {
      metadata,
    })
    console.log(`[AutoTranslate] Translated product ${product.id} to Uzbek`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
