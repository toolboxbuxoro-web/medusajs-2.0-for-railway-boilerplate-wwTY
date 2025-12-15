import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { translateText } from "../lib/translation-service"

export default async function autoTranslateCategory({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  const category = await productService.retrieveProductCategory(data.id)

  let needsUpdate = false;
  const metadata = category.metadata || {};

  const nameManual = metadata.name_uz_manual === true
  const descManual = metadata.description_uz_manual === true

  if (category.name && !nameManual) {
    const nameSrc = metadata.name_uz_src as string | undefined
    const shouldTranslateName = !metadata.name_uz || nameSrc !== category.name

    if (shouldTranslateName) {
      const translatedName = await translateText(category.name, "uz")
      if (translatedName) {
        metadata.name_uz = translatedName
        metadata.name_uz_src = category.name
        needsUpdate = true
      }
    }
  }

  // If RU description was removed, clear auto translation (unless manual)
  if (!category.description && !descManual && (metadata.description_uz || metadata.description_uz_src)) {
    metadata.description_uz = null
    metadata.description_uz_src = null
    needsUpdate = true
  }

  if (category.description && !descManual) {
    const descSrc = metadata.description_uz_src as string | undefined
    const shouldTranslateDesc = !metadata.description_uz || descSrc !== category.description

    if (shouldTranslateDesc) {
      const translatedDescription = await translateText(category.description, "uz")
      if (translatedDescription) {
        metadata.description_uz = translatedDescription
        metadata.description_uz_src = category.description
        needsUpdate = true
      }
    }
  }

  if (needsUpdate) {
    await productService.updateProductCategories(category.id, {
      metadata,
    })
    console.log(`[AutoTranslate] Translated category ${category.id} to Uzbek`)
  }
}

export const config: SubscriberConfig = {
  event: ["product-category.created", "product-category.updated"],
}
