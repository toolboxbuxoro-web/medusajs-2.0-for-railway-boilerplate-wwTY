# Localization Strategy

Toolbox uses a multi-layered approach to localization to support RU (Russian) and UZ (Uzbek) markets effectively.

## 1. Static Content (UI Strings)
UI labels (Buttons, Headers, Input labels) are stored in JSON files:
- `messages/ru.json`
- `messages/uz.json`

**Access**: via `next-intl` (Server & Client versions).

## 2. Dynamic Content (CMS/Medusa)
We avoid duplicating entries in the Medusa database for different languages. Instead, we use the **Metadata Strategy**.

### 2.1 Metadata Structure
Product, Collection, and Category names/descriptions are stored in the `metadata` field of the respective Medusa entity.
```json
{
  "title_ru": "Дрель",
  "title_uz": "Burg'u",
  "description_ru": "Мощная дрель...",
  "description_uz": "Kuchli burg'u..."
}
```

### 2.2 `getLocalizedField`
All localized data must be accessed through a unified utility:
```typescript
import { getLocalizedField } from "@lib/util/get-localized-field"

const title = getLocalizedField(product.metadata, "title", locale, product.title)
```
- **Fallback Logic**: If the requested locale version is missing in metadata, it falls back to the default field value (usually English or the primary entry).

## 3. SEO & Alternates
To prevent duplicate content penalties and ensure users land on the correct language version, we implement `generateAlternates`.

- **Hreflang**: Every page generates headers pointing to other language versions of itself.
- **Canonical**: Each page points to its localized self as the canonical source.
- **Helper**: `src/lib/util/seo.ts` handles the logic for constructing these URLs based on the `countryCode` and `locale` segments.

## 4. Scalability (Adding a Language)
To add a new language (e.g., English `en`):
1.  Add `en.json` to `/messages`.
2.  Update `i18n.ts` config to include `en`.
3.  Add `title_en` and `description_en` to product metadata in the Medusa Admin.
4.  **No code changes** are required in the components as they use the generic `getLocalizedField`.
