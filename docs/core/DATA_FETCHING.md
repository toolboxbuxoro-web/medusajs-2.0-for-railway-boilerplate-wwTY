# Data Fetching & Caching Strategy

This document defines how data is retrieved from Medusa 2.x and how caching is applied to ensure high performance and consistency.

## 1. The Fetching Chain

All data fetching is centralized in `src/lib/data`. We strictly use the Medusa JS SDK with Next.js specific configurations.

### 1.1 Region Resolution (The Foundation)
Region resolution is the most frequent operation.
```typescript
// lib/data/regions.ts
export const getRegion = cache(async function (countryCode: string) {
  const regions = await listRegions() // Fetches all regions (cached)
  // Logic to find region by ISO_2 and fallback to default (us/uz)
  return region
})
```
**Why this way?**
- It avoids global variables.
- It is deterministic: Given a `countryCode`, it always returns the same `Region`.
- It is fast: `listRegions` uses `revalidate` tags behind the scenes.

## 2. Cache TTL & Revalidation

We use a tiered caching strategy based on the volatility of the data.

| Data Type | Revalidate (Seconds) | Next.js Tag | Cache Type |
|-----------|----------------------|-------------|------------|
| Regions | Infinite (Manual) | `regions` | Data Cache |
| Collections | 3600 (1 hour) | `collections` | Data Cache |
| Products | 300 (5 mins) | `products` | Data Cache |
| Banners | 600 (10 mins) | `banners` | Data Cache |
| Cart | 0 (Dynamic) | - | No Cache |

## 3. Implementation Patterns

### 3.1 Deduplication with `React.cache()`
Every export in `lib/data` is wrapped in `cache()`. This is NOT the "Data Cache" (which persists across requests), but the "Request Memoization" (which lasts only for the duration of a single render).

**Anti-pattern to avoid**:
```typescript
// BAD: Calling SDK directly in components
const { products } = await sdk.store.product.list(...)
```
**Preferred pattern**:
```typescript
// GOOD: Calling wrapped lib/data function
const products = await getProductsList({ countryCode })
```

### 3.2 Immutability in Aggregation
When aggregating products into collections (e.g., for the homepage), we use `.map()` and spread operators. We NEVER mutate the original objects returned by the cache, as this can lead to unpredictable behavior in the Next.js shared cache.

## 4. Error Handling
- **medusaError**: All SDK calls are piped through a custom error handler to normalize responses.
- **Fail-safe Fallbacks**: If a region or collection fetch fails, the system is designed to return `null` or an empty array rather than throwing a 500. The UI components (e.g., `Home`) are responsible for showing a "safe" fallback state.
