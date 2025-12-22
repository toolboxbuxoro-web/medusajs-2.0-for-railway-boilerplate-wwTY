# Homepage Architecture

The homepage is the most complex page in terms of data orchestration, as it aggregates banners, regions, collections, and products.

## 1. Core Purpose
The homepage serves three functions:
1.  **Context Resolution**: Detects and confirms the user's region/country.
2.  **Trust Building**: Communicates the BTS-only delivery model (Buy Online, Pick Up in Store).
3.  **Catalog Teasing**: Shows featured collections and popular products.

## 2. Rendering Stability
Historically, the homepage suffered from "empty loads" where products would only appear after a refresh. This was solved by:

### 2.1 The "Layout-First" Rule
The page component (`page.tsx`) must **never** return `null`. Returning `null` in an App Router page can break the layout shell and lead to hydration errors.

### 2.2 Fallback UI over Early Returns
If data (collections or products) is missing or still fetching (during partial revalidation):
- **DO NOT** early return.
- **DO** render the page structure (Banner, Headers).
- **DO** show a localized placeholder/loading text where the products would be.
- **DO** use `safeCollections = collections || []` to ensure mapping doesn't crash.

## 3. Section Orchestration

- **BannerSlider**: Fetches from `/store/banners`. Stable, independent.
- **TopCategories**: Uses the same `collections` array as the rest of the page to ensure consistency.
- **FeaturedProducts**: A server component that receives the pre-fetched and aggregated collections. It simply renders the list, avoiding any internal fetching logic.

## 4. BTS Value Blocks
The homepage includes dedicated blocks explaining:
- Map integration (location of stores).
- Pickup timelines.
- Warranty and trust statements.

These blocks are hardcoded in the modules to ensure they remain focused on the BTS model and are not accidentally replaced by standard shipping info.
