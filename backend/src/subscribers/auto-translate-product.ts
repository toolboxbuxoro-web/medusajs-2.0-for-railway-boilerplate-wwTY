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

  // Avoid infinite loops if update triggers another update
  // We check if the translation is already present and matches the current content to avoid re-translating
  // However, for simplicity, we'll just check if the metadata fields are missing or if we want to force update.
  // A better approach for updates is to check if the title/description changed, but we don't have the old data here easily.
  // For now, we will translate if the target metadata is missing.
  
  let needsUpdate = false;
  const metadata = product.metadata || {};

  if (product.title && !metadata.title_uz) {
    const translatedTitle = await translateText(product.title, 'uz');
    if (translatedTitle) {
      metadata.title_uz = translatedTitle;
      needsUpdate = true;
    }
  }

  if (product.description && !metadata.description_uz) {
    const translatedDescription = await translateText(product.description, 'uz');
    if (translatedDescription) {
      metadata.description_uz = translatedDescription;
      needsUpdate = true;
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
