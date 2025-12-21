# UX Rules for Authentication

## OTP Resend Timer
- **Rule**: Every screen that requests an OTP must show a 60-second countdown before allowing a resend.
- **Implementation**: Handled via local component state and `setInterval`.
- **Reason**: Prevents SMS provider overage and user frustration from receiving multiple overlapping codes.

## Error Messages
- **Rule**: Never show raw technical errors (e.g., `Redis connection failed`).
- **Standardization**: Backend returns error codes (keys). Frontend maps these keys to localized strings.
- **Keys**: `account_exists`, `otp_cooldown`, `invalid_code`, `expired_code`, `failed_to_send_otp`.

## 2-Step Flows
- **Rule**: For registration and password reset, use a 2-step process.
  - **Step 1**: Phone number entry.
  - **Step 2**: All other details + OTP code.
- **UI Transition**: The phone number field becomes read-only in Step 2 to ensure the OTP is verified for the correct number.

## Feedback and Success
- **Rule**: Show distinct success states for sensitive actions like password reset and phone change.
- **Implementation**: Use the `success` namespace in translation files and clear visual indicators (green badges or success screens).

## Input Masking and Validation
- **Rule**: OTP input should be numeric-only with `inputMode="numeric"`.
- **Validation**: Phone numbers should be validated for length and format before allowing the "Send Code" action.
