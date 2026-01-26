import { HttpTypes } from "@medusajs/types"

/**
 * Получает URL медиа для категории с правильным приоритетом:
 * 1. icon_url (приоритет выше)
 * 2. image_url (если нет icon_url)
 * 3. null (если нет ни того, ни другого)
 * 
 * @param category - Категория продукта
 * @returns Объект с iconUrl и imageUrl, или null если ничего нет
 */
export function getCategoryMedia(category: HttpTypes.StoreProductCategory): {
  iconUrl: string | null
  imageUrl: string | null
  displayUrl: string | null // URL для отображения (iconUrl или imageUrl)
  type: 'icon' | 'image' | null // Тип медиа для отображения
} {
  const iconUrl = (category.metadata?.icon_url as string | undefined) || null
  const imageUrl = (category.metadata?.image_url as string | undefined) || null
  
  // Приоритет: сначала icon_url, потом image_url
  const displayUrl = iconUrl || imageUrl
  const type = iconUrl ? 'icon' : (imageUrl ? 'image' : null)
  
  return {
    iconUrl,
    imageUrl,
    displayUrl,
    type
  }
}

/**
 * Проверяет, есть ли у категории медиа (иконка или изображение)
 */
export function hasCategoryMedia(category: HttpTypes.StoreProductCategory): boolean {
  const media = getCategoryMedia(category)
  return media.displayUrl !== null
}
