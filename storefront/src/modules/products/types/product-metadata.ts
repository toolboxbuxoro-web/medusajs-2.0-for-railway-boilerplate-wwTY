/**
 * Canonical Product Metadata Schema v1
 * 
 * This file defines the structured content model for product metadata.
 * All products should conform to this schema.
 * 
 * Usage:
 * const metadata = parseProductMetadata(product.metadata)
 * // metadata is guaranteed to have safe defaults for all fields
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ProfessionalLevel = "бытовой" | "профессиональный"

export interface ProductMetadata {
  // Core Info
  brand: string
  category: string
  professional_level: ProfessionalLevel
  pickup_only: boolean

  // Content
  short_description: string
  features: string[]
  use_cases: string[]
  specifications: Record<string, string>

  // SEO
  seo_title: string
  seo_description: string
  seo_keywords: string[]

  // Localization (flat keys for compatibility)
  title_uz?: string
  description_uz?: string
  
  // Aggregated Ratings
  rating_avg: number
  rating_count: number

  // System (DO NOT RENDER)
  mxik_code?: string
  package_code?: string
}

// ============================================================================
// SAFE DEFAULTS
// ============================================================================

export const EMPTY_PRODUCT_METADATA: ProductMetadata = {
  brand: "",
  category: "",
  professional_level: "бытовой",
  pickup_only: true,
  short_description: "",
  features: [],
  use_cases: [],
  specifications: {},
  seo_title: "",
  seo_description: "",
  seo_keywords: [],
  rating_avg: 0,
  rating_count: 0,
}

// ============================================================================
// PARSER (Safe Extraction with Defaults)
// ============================================================================

/**
 * Safely parse raw metadata into a typed ProductMetadata object.
 * Guarantees no null values - uses safe defaults for missing fields.
 */
export function parseProductMetadata(raw: unknown): ProductMetadata {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_PRODUCT_METADATA }
  }

  const data = raw as Record<string, unknown>

  return {
    // Core Info
    brand: getString(data, "brand", ""),
    category: getString(data, "category", ""),
    professional_level: getProfessionalLevel(data),
    pickup_only: getBoolean(data, "pickup_only", true),

    // Content
    short_description: getString(data, "short_description", ""),
    features: getStringArray(data, "features"),
    use_cases: getStringArray(data, "use_cases"),
    specifications: getStringRecord(data, "specifications"),

    // SEO
    seo_title: getString(data, "seo_title", ""),
    seo_description: getString(data, "seo_description", ""),
    seo_keywords: getStringArray(data, "seo_keywords"),

    // Localization
    title_uz: getString(data, "title_uz", undefined),
    description_uz: getString(data, "description_uz", undefined),

    // Aggregated Ratings
    rating_avg: getNumber(data, "rating_avg", 0),
    rating_count: getNumber(data, "rating_count", 0),

    // System
    mxik_code: getString(data, "mxik_code", undefined),
    package_code: getString(data, "package_code", undefined),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getString(data: Record<string, unknown>, key: string, defaultValue: string): string
function getString(data: Record<string, unknown>, key: string, defaultValue: undefined): string | undefined
function getString(data: Record<string, unknown>, key: string, defaultValue: string | undefined): string | undefined {
  const value = data[key]
  if (typeof value === "string" && value.trim() !== "" && value !== "-") {
    return value
  }
  return defaultValue
}

function getBoolean(data: Record<string, unknown>, key: string, defaultValue: boolean): boolean {
  const value = data[key]
  if (typeof value === "boolean") {
    return value
  }
  return defaultValue
}

function getStringArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => 
      typeof item === "string" && item.trim() !== "" && item !== "-"
    )
  }
  return []
}

function getStringRecord(data: Record<string, unknown>, key: string): Record<string, string> {
  const value = data[key]
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const result: Record<string, string> = {}
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim() !== "" && v !== "-") {
        result[k] = v
      }
    })
    return result
  }
  return {}
}

function getProfessionalLevel(data: Record<string, unknown>): ProfessionalLevel {
  const value = data["professional_level"]
  if (value === "профессиональный") {
    return "профессиональный"
  }
  return "бытовой"
}

function getNumber(data: Record<string, unknown>, key: string, defaultValue: number): number {
  const value = data[key]
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}
