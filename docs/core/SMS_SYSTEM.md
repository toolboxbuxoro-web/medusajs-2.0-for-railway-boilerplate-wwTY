# SMS System

Centralized management for all critical SMS communications.

## 1. Unified Entry Point
Post-purchase SMS delivery is strictly centralized in the backend to prevent duplicate or conflicting notifications.
- **Main Handler**: `backend/src/subscribers/order-sms-handler.ts`.
- **Trigger**: `order.placed` event.

## 2. SMS Types

| Type | Source | Logic |
| :--- | :--- | :--- |
| **OTP Code** | `otp/request` | Sent immediately during verification. |
| **Credentials** | `order-sms-handler` | Sent if `tmp_generated_password` is exists in cart metadata. |
| **Order Confirmation**| `order-sms-handler` | Sent for every successful order. |

## 3. Phone Number Resolution
The system uses the following priority to find a valid recipient phone:
1. **Shipping Address**: primary source (used for delivery coord).
2. **Contact Metadata**: fallback for quick orders or special flows.
3. **Customer Profile**: last resort if address is missing.

All phone numbers are normalized to the Uzbekistan format (`998...`) before transmission.

## 4. Local Development (Mocking)
To prevent unnecessary costs and API calls during development:
- **Condition**: `process.env.APP_ENV === "local"` or `APP_ENV === "development"`.
- **Behavior**: `EskizSmsService` logs the message to the console instead of calling the Eskiz API.
- **Verification**: Developers should check backend console logs for "Sent SMS to...".

## 5. Delivery Guarantees
- **Atomic OTP**: Redis-based verification ensures the same code won't be reused for different actions.
- **Order-First**: Post-purchase SMS are only triggered *after* the order is persisted in the database, ensuring users don't get notifications for failed transactions.
