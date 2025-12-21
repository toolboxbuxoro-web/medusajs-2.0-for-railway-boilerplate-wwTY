# Authentication System

## Overview
The system uses a **Phone-First** approach. Phone numbers are the primary identifier for users. Email addresses are abstracted away and generated internally as `{phone}@phone.local`.

## Key Principles
- **No Email UI**: Users never see or enter an email address.
- **Phone Normalization**: All phone numbers are normalized to a standard format (e.g., `998901234567`) before processing.
- **Purpose-Based OTP**: Every OTP is tied to a specific `purpose` (e.g., `register`, `reset_password`).
- **Secure by Default**: OTPs are required for registration, password reset, and sensitive profile changes.

## User Flow (High Level)
1. **Request**: User enters phone number.
2. **Verify**: OTP is sent via SMS. User enters 6-digit code.
3. **Action**: If verified, the intended action (register, login, reset) is performed.

## Backend Implementation
- **Medusa 2.0 Auth**: Uses the `emailpass` provider where `email` is the technical phone-based email.
- **Custom OTP Store**: A Redis-backed store manages OTP codes, verification flags, and cooldowns.
- **Atomic Operations**: Verification and consumption are handled via Lua scripts in Redis to prevent race conditions.

## Technical Email Generation
```typescript
const email = `${normalizedPhone}@phone.local`
```
This email is used internally by Medusa's Auth and Customer modules.
