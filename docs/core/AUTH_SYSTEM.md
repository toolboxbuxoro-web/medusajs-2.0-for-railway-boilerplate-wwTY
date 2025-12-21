# Auth System

The Toolbox platform uses a **Phone-First Identity Model**. 

## 1. Identity Model
- **Identifier**: Normalized Uzbekistan phone (`998xxxxxxxxx`).
- **Internal Shim**: Mapped to synthetic email `${phone}@phone.local` for Medusa `emailpass` compatibility.
- **Provider**: `emailpass`.

## 2. Key Flows

### A. Registration (Standard)
- **Entry**: `/account/register` -> `signup` server action.
- **Verification**: OTP is mandatory for phone ownership validation.
- **Process**: Form Submit -> OTP Request -> User enters code -> Account Created + Auto-logged in.

### B. Login
- **Process**: User enters phone + password.
- **Mechanism**: Phone is normalized and converted to synthetic email for backend authentication.

### C. Password Recovery
- **Request**: `/store/otp/request` (purpose: `reset_password`).
- **Verification**: `/store/otp/verify` checks Redis flag.
- **Finalization**: `/store/otp/reset-password` updates the `emailpass` provider with the new password.

### D. Personal Account (Profile)
- **Profile Name**: Direct update via Medusa SDK.
- **Phone Change**: Currently allows direct update via customer metadata (⚠️ Risk).
- **Password Change**: Guarded by Phone OTP + Old Password.

## 3. OTP Lifecycle (Redis)
All OTP operations are **Atomic** (using Lua scripts in `lib/otp-store.ts`) to prevent race conditions.
1. **Send**: Stores `otp:{phone}` (TTL 15m).
2. **Verify**: Deletes `otp:{phone}` and sets `otp_verified:{phone}` (TTL 30m) if successful.
3. **Consume**: One-time removal of the `otp_verified` flag during account creation or critical updates.

## 4. Risks & Decisions
- **[RISK] Unverified Phone Change**: Users can change their phone in the profile without verifying the *new* number. Needs fixing to prevent account lockout or hijacking.
- **[DECISION] Synthetic Email**: Using `@phone.local` allows seamless integration with standard Medusa 2.0 modules without breaking core schemas.
- **[RISK] OTP Purpose**: Currently, a code for "Login" might be theoretically used for "Reset" if the phone matches. Needs strict purpose-checking in Redis.
- **[TODO] Account Lockout**: No current protection against brute-force password attempts (beyond cloud provider protection).
