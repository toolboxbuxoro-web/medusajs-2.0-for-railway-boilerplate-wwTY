# Toolbox Architecture

## 1. System Overview
- **Business Purpose**: A production-ready e-commerce platform for the "Toolbox" hardware brand, specialized for the Uzbekistan market.
- **Region and Localization**: Optimized for Uzbekistan (UZ). Supports RU and UZ locales. Primary identifier is the phone number.
- **High-Level Components**: 
  - **Storefront**: Next.js 14 App Router.
  - **Backend**: Medusa 2.0 (Framework).
  - **Infrastucture**: PostgreSQL, Redis (Workflows/Jobs), Meilisearch (Search), Minio (S3 storage).

## 2. Core Domains
- **Catalog**: Managed in Medusa, synced with MoySklad for inventory. Localized via metadata.
- **Cart**: Persistent via server-side cookies; includes specialized recovery for completed sessions.
- **Checkout**: Multi-step flow optimized for mobile. Includes custom delivery calculation and auto-registration.
- **Orders**: Standard Medusa orders with custom subscribers for regional SMS notifications.
- **Payments**: Integration with Payme and Click gateways (Uzbekistan).
- **Delivery**: Specialized integration with BTS Express for regional shipping.
- **Authentication**: Custom OTP-based auth using phone numbers as primary keys.
- **Integrations**: MoySklad (ERP), Eskiz (SMS), Payme/Click (Payments), BTS (Logistics).

## 3. Critical Business Flows

### 3.1 Checkout & Payment
1. **Cart Creation & Recovery**:
   - `retrieveCart` checks for `completed_at` timestamp or "already completed" SDK error.
   - If stale, the cart cookie is cleared, and a new cart is initialized to prevent hydration/state errors.
2. **Delivery Calculation (BTS Express)**:
   - Client fetches BTS regions/points via `/store/bts/regions`.
   - Cost is calculated client-side based on weight and zone.
   - Fallback: If the shipping option has no fixed price in Medusa, a custom POST to `/store/bts/shipping-method` attaches the calculated price to the cart.
3. **Payment Initiation**:
   - `initiatePaymentSession` called for Payme/Click providers.
   - Results in a `next_step` containing a redirect URL or payment form data.
4. **Async Confirmation Callbacks**:
   - Gateway sends POST to `/click/callback` or `/payme/callback`.
   - Backend verifies signature and amount, then captures the Medusa payment and finalizes the order asynchronously.
5. **Order Finalization & Side-effects**:
   - `order.placed` subscriber triggers:
     - SMS confirmation via Eskiz SMS.
     - Email (if enabled).
     - Implicit stock reservation in Medusa.

### 3.2 OTP Authentication
1. **Phone-based Flow**:
   - **Request**: `/store/otp/request` validates phone and sends 6-digit code via Eskiz API.
   - **Verify**: `/store/otp/verify` checks code against Redis. If valid, an atomic verification flag is set.
2. **State Management**:
   - OTP codes, verification flags, and rate limits are stored in Redis using atomic Lua scripts.
   - No OTP-related state is kept in application memory.
3. **Customer Linking (Auto-registration)**:
   - During checkout, `auto-register` endpoint:
     - Atomically consumes the verification flag from Redis (one-time use).
     - Checks for existing customer by email (phone-based `@phone.local`).
     - Creates `authIdentity` (credentials) and `customer` (profile).
     - Sends generated password to user via SMS for future logins.
4. **Failure Scenarios**:
   - OTP expiration (15 min).
   - Rate limiting via Eskiz.
   - Lack of `remoteLink` in custom routes can lead to detached identities if not managed carefully.

### 3.3 Stock Synchronization (MoySklad)
1. **Frequency**: Runs as a scheduled Medusa Job every **15 minutes**.
2. **Direction**: **MoySklad is the source of truth**.
3. **Process**:
   - Fetches all inventory counts from MoySklad API.
   - Maps MoySklad `code` field to Medusa `sku`.
   - Updates `stocked_quantity` in Medusa Inventory Module.
4. **Limitations**:
   - Synchronous batch processing; large catalogs (10k+) may require splitting into multiple job runs or async tasks.
   - Risk: SKU mismatch leads to zero stock in Medusa.

## 4. Event-Driven & Async Logic
- **Workflows**: Medusa 2.0 workflows used for Cart completion and Payment processing.
- **Subscribers**:
  - `order-placed.ts`: Handles Eskiz SMS notifications.
  - `auto-translate-*.ts`: Asynchronously translates Product/Category names to UZ/RU using Google Translate.
- **Side Effects**: Side effects are primarily triggered by the `order.placed` and `payment.captured` events.

## 5. External Integrations
- **Payme**: Uses merchant ID and secret for signature validation. Handles `perform_transaction` RPC.
- **Click**: Uses service ID and merchant ID. Handles `CLICK_PREPARE` and `CLICK_COMPLETE`.
- **Eskiz SMS**: Primary notification channel. Relies on pre-approved SMS templates.
- **MoySklad**: ERP for stock. Authenticaticates via Bearer Token.
- **BTS Delivery**: Regional logistics with zone-based pricing logic implemented in `lib/data/bts.ts`.

## 6. Known Risks & Constraints
- **Custom Shipping Prices**: The `bts/shipping-method` workaround bypasses standard weight-based pricing modules, making it sensitive to framework updates.
- **Email Dependency**: Many Medusa features require an email. The system uses `<phone>@phone.local` as a shim; this must be consistent across all modules.

## 7. Architectural Principles
- **What must NOT be broken**:
  - Phone-as-ID logic: Never allow duplicate customers with different emails for the same phone.
  - Stock integrity: Medusa must always follow MoySklad's counts.
- **Preferred Patterns**:
  - Use `lib/data` server actions for all mutations.
  - Keep regional business logic in custom Medusa Modules.
  - Use `metadata` for localized fields rather than schema changes.
- **Anti-patterns to avoid**:
  - Hardcoding secrets (always use `process.env`).
  - Storing sensitive state in in-memory Maps (use Redis for production scalability).
  - Mixing Locale and CountryCode in cart ID logic.
  
