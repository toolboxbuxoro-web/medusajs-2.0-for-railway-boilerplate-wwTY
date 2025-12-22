# Toolbox Architecture

> **Last Updated**: December 2024

## 1. System Overview
- **Business Purpose**: A production-ready e-commerce platform for the "Toolbox" hardware brand, specialized for the Uzbekistan market.
- **Region and Localization**: Optimized for Uzbekistan (UZ). Supports RU and UZ locales. Primary identifier is the phone number.
- **High-Level Components**: 
  - **Storefront**: Next.js 14 App Router with i18n support.
  - **Backend**: Medusa 2.0 (Framework).
  - **Infrastructure**: PostgreSQL, Redis (Workflows/Jobs/OTP), Meilisearch (Search), Minio (S3 storage).

## 2. Core Domains
- **Catalog**: Managed in Medusa, synced with MoySklad for inventory. Localized via metadata.
- **Cart**: Persistent via server-side cookies; includes specialized recovery for completed sessions.
- **Checkout**: Multi-step flow optimized for mobile. Includes custom delivery calculation and auto-registration.
- **Orders**: Standard Medusa orders with custom subscribers for regional SMS notifications.
- **Payments**: Integration with Payme and Click gateways (Uzbekistan).
- **Delivery**: **BTS-Only** integration. Standard street addresses are disabled. Delivery is strictly to BTS Pickup Points.
- **Authentication**: Custom OTP-based auth using phone numbers as primary keys.
- **Integrations**: MoySklad (ERP), Eskiz (SMS), Payme/Click (Payments), BTS (Logistics).

## 3. Critical Business Flows

### 3.1 Checkout & Payment
1. **Cart Creation & Recovery**:
   - `retrieveCart` checks for `completed_at` timestamp or "already completed" SDK error.
   - If stale, the cart cookie is cleared, and a new cart is initialized to prevent hydration/state errors.
2. **Delivery Calculation (BTS Express)**:
   - **Constraint**: Only BTS Pickup Points are supported. Home delivery addresses are not collected.
   - Client fetches BTS regions/points via `/store/bts/regions`.
   - Cost is calculated client-side based on weight and zone (Official BTS Tariff Card 2025).
   - Fallback: If the shipping option has no fixed price in Medusa, a custom POST to `/store/bts/shipping-method` attaches the calculated price to the cart.
3. **Payment Initiation**:
   - `initiatePaymentSession` called for Payme/Click providers.
   - Results in a `next_step` containing a redirect URL or payment form data.
4. **Async Confirmation Callbacks**:
   - Gateway sends POST to `/click/callback` or `/payme/callback`.
   - Backend verifies signature and amount, then captures the Medusa payment and finalizes the order asynchronously.
5. **Order Finalization & Side-effects**:
   - `order.placed` subscriber triggers:
     - SMS confirmation via Eskiz SMS (`order-sms-handler.ts`).
     - Email (if enabled).
     - Implicit stock reservation in Medusa.

### 3.2 OTP Authentication
1. **Phone-based Flow**:
   - **Request**: `/store/otp/request` validates phone and sends 6-digit code via Eskiz API.
   - **Verify**: `/store/otp/verify` checks code against Redis. If valid, an atomic verification flag is set.
   - **Purpose-specific endpoints**:
     - `/store/otp/reset-password` — password recovery flow.
     - `/store/otp/change-password` — change phone number flow.
     - `/store/otp/send` — generic OTP sending.
2. **State Management**:
   - OTP codes, verification flags, and rate limits are stored in Redis using atomic Lua scripts (`lib/otp-store.ts`).
   - No OTP-related state is kept in application memory.
3. **Customer Linking (Auto-registration)**:
   - During checkout, `auto-register` endpoint:
     - Atomically consumes the verification flag from Redis (one-time use).
     - Checks for existing customer by email (phone-based `@phone.local`).
     - Creates `authIdentity` (credentials) and `customer` (profile).
     - Links authIdentity ↔ customer via `app_metadata.customer_id`.
     - Sends generated password to user via SMS for future logins.
4. **Failure Scenarios**:
   - OTP expiration (configurable, default 15 min).
   - Rate limiting via Redis atomic counters.
   - SMS delivery failure blocks auto-registration (guaranteed delivery).

### 3.3 Stock Synchronization (MoySklad)
1. **Frequency**: Runs as a scheduled Medusa Job every **15 minutes**.
2. **Direction**: **MoySklad is the source of truth**.
3. **Process**:
   - Fetches all inventory counts from MoySklad API in batches of 1000.
   - Maps MoySklad `code` field to Medusa `sku`.
   - Updates `stocked_quantity` in Medusa Inventory Module.
4. **Limitations**:
   - Synchronous batch processing; large catalogs (10k+) may require splitting into multiple job runs or async tasks.
   - Risk: SKU mismatch leads to zero stock in Medusa.

## 4. Backend Architecture

### 4.1 Custom Modules (`backend/src/modules/`)
| Module | Purpose |
|--------|---------|
| `eskiz-sms` | Eskiz SMS notification provider |
| `moysklad` | MoySklad ERP integration (stock sync) |
| `payment-payme` | Payme payment gateway handler |
| `payment-click` | Click payment gateway handler |
| `minio-file` | Minio S3 file storage provider |
| `email-notifications` | Email notification templates |

### 4.2 Custom API Endpoints (`backend/src/api/store/`)
| Endpoint | Purpose |
|----------|---------|
| `/store/otp/*` | OTP request, verify, reset-password, change-password |
| `/store/auto-register` | Phone-based customer auto-registration |
| `/store/bts/*` | BTS Express regions and shipping methods |
| `/store/banners` | Promotional banners API |
| `/store/quick-order` | Quick order (buy-in-one-click) |
| `/store/payme` | Payme transaction handling |

### 4.3 Scheduled Jobs (`backend/src/jobs/`)
| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-moysklad-stock` | */15 * * * * | Sync inventory from MoySklad to Medusa |

### 4.4 Subscribers (`backend/src/subscribers/`)
| Subscriber | Event | Purpose |
|------------|-------|---------|
| `order-placed.ts` | `order.placed` | Trigger SMS notifications |
| `order-sms-handler.ts` | `order.*` | Format and send order SMS |
| `auto-translate-product.ts` | `product.created/updated` | Translate to UZ/RU |
| `auto-translate-category.ts` | `category.created/updated` | Translate to UZ/RU |
| `auto-translate-collection.ts` | `collection.created/updated` | Translate to UZ/RU |
| `invite-created.ts` | `invite.created` | Admin invite emails |

## 5. Storefront Architecture

### 5.1 Key Libraries (`storefront/src/lib/`)
| File | Purpose |
|------|---------|
| `data/cart.ts` | Cart mutations and retrieval with stale recovery |
| `data/bts.ts` | BTS Express regions, points, and pricing (Tariff 2025) |
| `data/customer.ts` | Customer auth, registration, password flows |
| `data/banners.ts` | Promotional banners fetching |
| `search-client.ts` | Meilisearch integration |
| `util/prices.ts` | Price formatting for UZS |

### 5.2 Internationalization
- **Locales**: `ru`, `uz`
- **Messages**: `storefront/messages/{ru,uz}.json`
- **Middleware**: Locale detection and routing

### 5.3 E2E Testing
- **Framework**: Playwright
- **Location**: `storefront/e2e/`
- **Config**: `storefront/playwright.config.ts`

## 6. External Integrations
| Integration | Authentication | Purpose |
|-------------|---------------|---------|
| **Payme** | Merchant ID + Secret | Payment gateway (Uzbekistan) |
| **Click** | Service ID + Merchant ID | Payment gateway (Uzbekistan) |
| **Eskiz SMS** | Bearer Token | SMS notifications (pre-approved templates) |
| **MoySklad** | Bearer Token | ERP stock synchronization |
| **BTS Delivery** | Zone-based pricing | Regional logistics |

## 7. Known Risks & Constraints
- **Address Data**: Standard `shipping_address` fields (address_1, city) are not collected. UI must rely on `metadata.bts_delivery`. Re-enabling address fields requires significant refactoring.
- **Custom Shipping Prices**: The `bts/shipping-method` workaround bypasses standard weight-based pricing modules, making it sensitive to framework updates.
- **Email Dependency**: Many Medusa features require an email. The system uses `<phone>@phone.local` as a shim; this must be consistent across all modules.
- **SMS Delivery**: Auto-registration fails if SMS cannot be delivered (by design — credentials must reach user).

## 8. Architectural Principles
- **What must NOT be broken**:
  - Phone-as-ID logic: Never allow duplicate customers with different emails for the same phone.
  - BTS-Only Delivery: Never expose standard address inputs in checkout or profile.
  - Stock integrity: Medusa must always follow MoySklad's counts.
  - OTP atomicity: All OTP operations must use Redis atomic scripts.
- **Preferred Patterns**:
  - Use `lib/data` server actions for all mutations.
  - Keep regional business logic in custom Medusa Modules.
  - Use `metadata` for localized fields rather than schema changes.
- **Anti-patterns to avoid**:
  - Hardcoding secrets (always use `process.env`).
  - Storing sensitive state in in-memory Maps (use Redis for production scalability).
  - Mixing Locale and CountryCode in cart ID logic.
