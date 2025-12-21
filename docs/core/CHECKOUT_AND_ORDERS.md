# Checkout & Orders

Detailed logic for purchase flows and automated identity management.

## 1. Checkout Paths

### A. Guest Checkout (OTP-Guarded)
The standard path for new customers.
1. **Address Entry**: Requires Name and normalized Phone.
2. **OTP**: User must verify phone ownership via 6-digit SMS code.
3. **Auto-Register**: Once verified, the storefront calls `/store/auto-register` which:
   - Sets the `otp_verified` flag to consumed.
   - Creates a Medusa Customer and Auth Identity.
   - Generates a temporary 6-digit password.
   - **Crucial**: Updates the cart metadata with `tmp_generated_password` and `is_new_customer: true`.
4. **Completion**: Order placed after payment.

### B. Quick Order (1-Click)
Streamlined path from product pages.
1. **Input**: User name and phone in modal.
2. **Backend**: Calls `/store/quick-order`.
   - Creates a cart and auto-registers the user (if new).
   - Saves `tmp_generated_password` directly to cart metadata.
   - Completes order creation.

## 2. Account Creation Timing
- **Guest**: Account is created *during* the checkout process (at the contact info step) but credentials are only sent *after* order placement.
- **Returning User**: Uses existing Customer session.

## 3. Post-Purchase Flow
After order placement (`order.placed`), the backend handles asynchronous tasks:
- **Centralized SMS**: `order-sms-handler.ts` reads cart metadata.
- **Credentials Delivery**: If `tmp_generated_password` is found, it sends an SMS with login data.
- **Confirmation**: Sends a standard "Order Received" SMS with total amount.

## 4. Data Consistency Invariants
- **Cart Metadata**: The `tmp_generated_password` is the source of truth for the first-time password.
- **Idempotency**: `auto-register` relies on atomic Redis `GETDEL` of the verification flag to prevent duplicate registration attempts from different tabs.
