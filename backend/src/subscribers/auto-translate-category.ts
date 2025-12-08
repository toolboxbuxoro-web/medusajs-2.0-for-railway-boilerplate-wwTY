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

  if (category.name && !metadata.name_uz) {
    const translatedName = await translateText(category.name, 'uz');
    if (translatedName) {
      metadata.name_uz = translatedName;
      needsUpdate = true;
    }
  }

  if (category.description && !metadata.description_uz) {
    const translatedDescription = await translateText(category.description, 'uz');
    if (translatedDescription) {
      metadata.description_uz = translatedDescription;
      needsUpdate = true;
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
