# Developer Guide

> **Last Updated**: January 2026  
> **Audience**: Frontend/Backend developers, UX designers

---

## 1. Core Principles

### Phone is the Identity
- **Rule**: Phone number is the primary user identifier
- **Do**: Show phone, hide technical email (`998...@phone.local`)
- **Don't**: Expose Medusa's internal email format to users

### BTS-Only Delivery
- **Rule**: No standard addresses — only pickup point selection
- **Do**: Use BTS region/point selectors in checkout
- **Don't**: Render address_1, city, postal_code inputs

### Phone-First OTP
- **Rule**: All sensitive actions require OTP verification
- **Required for**: Registration, password reset, phone change, checkout

---

## 2. Localization

### Static Strings
```tsx
// Use next-intl for UI labels
import { useTranslations } from 'next-intl'
const t = useTranslations()
<Button>{t('save_changes')}</Button>
```

### Dynamic Content (Products, Categories)
```tsx
// Use metadata fields for CMS content
import { getLocalizedField } from '@lib/util/get-localized-field'
const title = getLocalizedField(product.metadata, 'title', locale, product.title)
```

### Translations
- Files: `storefront/messages/ru.json`, `storefront/messages/uz.json`
- Namespaces: `account.*`, `errors.*`, `success.*`, `common.*`, `checkout.*`
- Rule: All keys must exist in BOTH files

---

## 3. Error Handling

### Backend → Frontend Mapping

| Backend Error | Translation Key | User Message (RU) |
|---------------|-----------------|-------------------|
| `invalid_code` | `errors.invalid_code` | "Неверный код подтверждения." |
| `invalid_phone` | `errors.invalid_phone` | "Введите корректный номер..." |
| `otp_cooldown` | `errors.otp_cooldown` | "Подождите 60 секунд..." |
| `too_many_requests` | `errors.too_many_requests` | "Слишком много попыток." |

### Pattern
```tsx
// ✅ Good: Map errors to translation keys
<Badge color="red">{t(`errors.${error}`)}</Badge>

// ❌ Bad: Show raw backend error
<Badge color="red">{error}</Badge>
```

---

## 4. OTP Flow Pattern

```tsx
// Step 1: User submits without OTP code
// → Backend sends SMS, returns "otp_sent"

// Step 2: User enters OTP code, submits again
// → Backend verifies, performs action, returns success

const [state, formAction] = useFormState(changePhoneWithOtp, null)

if (state === 'otp_sent') {
  // Show "Code sent" message
  // Enable OTP input field
}
```

---

## 5. Data Fetching Rules

### ✅ Do

```tsx
// Use lib/data functions
import { getProductsList } from '@lib/data/products'
const products = await getProductsList({ countryCode })
```

### ❌ Don't

```tsx
// Direct SDK calls in components
const { products } = await sdk.store.product.list(...)
```

### Caching

| Data | Revalidate | Tag |
|------|------------|-----|
| Regions | Infinite | `regions` |
| Collections | 1 hour | `collections` |
| Products | 5 min | `products` |
| Cart | Never | - |

---

## 6. Component Patterns

### Server vs Client Components

```tsx
// Server Component (default) - data fetching
export default async function Page() {
  const data = await fetchData()
  return <ClientForm data={data} />
}

// Client Component - interactivity
"use client"
export function ClientForm({ data }) {
  const [state, action] = useFormState(...)
  return <form action={action}>...</form>
}
```

### Loading States

```tsx
// Always disable buttons during async
<Button isLoading={pending} type="submit">
  {t('save_changes')}
</Button>
```

### Confirmations Required For
- Logout
- Delete actions
- Destructive operations

---

## 7. Mobile-First Design

```tsx
// Single column mobile, two columns desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  ...
</div>

// Hide/show based on breakpoint
<div className="lg:hidden">Mobile only</div>
<div className="hidden lg:block">Desktop only</div>
```

---

## 8. Testing Checklist

Before deploying new features:

- [ ] Works on mobile (375px width)
- [ ] All text is translated (RU + UZ)
- [ ] Error messages are user-friendly
- [ ] Loading states present
- [ ] `data-testid` attributes added
- [ ] Cache invalidation working (`revalidateTag`)

---

## 9. Collections cache & revalidation workflow

### When you change collection metadata in Medusa
- **Typical changes**: `metadata.bg_color`, `metadata.bg_image`, `metadata.text_color`, localized titles/descriptions and other storefront-facing fields.

### Steps to update the storefront
1. **Change collections in Medusa Admin**
   - Open the collection you need.
   - Update `metadata.bg_color`, `metadata.bg_image`, `metadata.text_color` and/or localized metadata fields.
   - Save the collection.

2. **Trigger collections cache revalidation**
   - Go to the `apps/backend` project.
   - Run the revalidation script (from the backend workspace root):
     - `pnpm revalidate:collections`
   - The script sends `POST /api/revalidate` with `tags: ["collections"]` to the storefront and logs success/errors in the console.

3. **Verify on the storefront**
   - Open the main storefront page and relevant collection pages.
   - Make sure the updated background color/image and text color are applied for all affected collections.

### Notes
- **Dev mode**:
  - You may temporarily reduce caching or run `pnpm revalidate:collections` more often while iterating on collection design.
- **Production**:
  - Always rely on the `revalidate:collections` script after changing collections in Medusa.
  - Do not bypass caching logic with ad-hoc `no-store` fetches in components — use the documented `revalidate` flow instead.
