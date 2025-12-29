import { locales, defaultLocale } from "../../i18n"

type EntityWithMetadata = {
  metadata?: Record<string, unknown> | null
  [key: string]: any
}

/**
 * Universal localization helper for metadata-based translations.
 * 
 * Logic:
 * 1. Try metadata[`${field}_${locale}`]
 * 2. Fallback to entity[field] (which is the default language, usually RU)
 * 3. Return null if missing
 * 
 * Adding a new language (e.g., 'en') requires:
 * 1. Adding 'en' to src/i18n.ts
 * 2. Creating messages/en.json
 * 3. Admin filling metadata fields title_en, description_en, etc.
 * No code changes to this helper or consumers required.
 * 
 * TODO: Optional future structured metadata:
 * metadata.localized[locale][field]
 */
export function getLocalizedField<T extends EntityWithMetadata>(
  entity: T | null | undefined,
  field: string,
  locale: string,
  fallbackLocale: string = defaultLocale
): string | null {
  if (!entity) return null

  // 1. Try metadata[`${field}_${locale}`]
  const localizedKey = `${field}_${locale}`
  const localizedMetadataValue = entity.metadata?.[localizedKey]
  
  if (
    localizedMetadataValue && 
    typeof localizedMetadataValue === "string" && 
    localizedMetadataValue.trim() !== "" && 
    localizedMetadataValue !== "-"
  ) {
    return localizedMetadataValue
  }

  // 1.5. Try top-level entity[`${field}_${locale}`] (for objects like Banners)
  const localizedTopLevelValue = entity[localizedKey]
  if (
    localizedTopLevelValue && 
    typeof localizedTopLevelValue === "string" && 
    localizedTopLevelValue.trim() !== "" && 
    localizedTopLevelValue !== "-"
  ) {
    return localizedTopLevelValue
  }

  // 2. Fallback to the default field on the entity itself
  const defaultValue = entity[field]
  if (
    defaultValue && 
    typeof defaultValue === "string" && 
    defaultValue.trim() !== "" && 
    defaultValue !== "-"
  ) {
    return defaultValue
  }

  return null
}
