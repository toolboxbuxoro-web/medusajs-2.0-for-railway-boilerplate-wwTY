# Architecture & Serverless Safety

This document outlines the core architectural principles of the Toolbox storefront, focusing on stability, serverless compatibility, and the integration between Next.js App Router and Medusa 2.x.

## 1. System Topology

```text
[ Client Browser ]
       │
       ▼
[ Next.js App Router (Vercel/Node) ]  ◄─── [ Static Assets / Edge Cache ]
       │
       ├─► [ React Server Components ] ───┐
       │                                  │ (sdk.store.*)
       └─► [ Server Actions / API ]       ▼
                                   [ Medusa 2.x Backend ]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
            [ PostgreSQL ]                                   [ Redis ]
         (Relational Data)                            (OTP / Workflows)
```

## 2. Serverless Safety Principles

The storefront is designed to run in highly distributed, stateless environments (Vercel, Railway, AWS Lambda). 

### 2.1 Elimination of In-Memory State
In serverless environments, global variables (like `Map`, `Set`, or simple objects outside of a request context) are unreliable. They can linger between executions or be empty on cold starts, leading to "products appear only after refresh" bugs.

*   **Rule**: NO global caches or stateful variables in `lib/data`.
*   **Implementation**: The `regionMap` was removed. Every request now resolves its context deterministically using `React.cache()` and Next.js Data Cache.

### 2.2 Deterministic Resolution
Every page and component must be able to resolve its required context (Region, Locale, Currency) independently. 
- **Region**: Resolved via `getRegion(countryCode)` which calls a cached `listRegions()`.
- **Deduplication**: `React.cache()` ensures that if 10 components on the same page call `getRegion()`, the underlying SDK call is executed exactly once.

## 3. Homepage Strategy

The homepage is the most critical entry point and uses a "Safe-Render" strategy.

### 3.1 Data Flow
1.  **Request**: User hits `/ru/uz`.
2.  **Parallel Fetch**: `page.tsx` triggers `getCollectionsWithProducts` and `getRegion`.
3.  **Aggregation**: Collections are fetched (revalidate: 3600), then products for those collections are fetched (revalidate: 300).
4.  **Transformation**: Products are mapped to their respective collections in a pure, immutable fashion.
5.  **Safe Render**: If data is missing, we show a localized "Products Loading/Not Found" message instead of returning `null` (which breaks layout) or crashing.

### 3.2 Component Minimization
To prevent hydration mismatches and performance degradation:
- **TopCategories**: Rendered exactly once with the collection list.
- **FeaturedProducts**: Orchestrated by the page to ensure it receives exactly what it needs without re-fetching.

## 4. BTS-Only Delivery Constraints

The system is hard-coded for the **BTS Express** delivery model (Pick Up in Store).
- **No Shipping Addresses**: Standard address inputs are removed from Checkout and Profile.
- **Metadata dependency**: All delivery information (Pickup point ID, Region ID) is stored in the order/cart `metadata`.
- **Constraint**: Changing to home delivery requires a reversal of the UI hiding logic in `modules/checkout`.
