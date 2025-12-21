# OTP Flow Details

## Lifecycle of an OTP
1. **Generation**: A 6-digit numeric code is generated.
2. **Storage**: Stored in Redis with the key `otp:{phone}:{purpose}` and a 15-minute TTL.
3. **Cooldown**: A cooldown key `otp_cooldown:{phone}:{purpose}` is set for 60 seconds to prevent spam.
4. **Sending**: Sent via SMS (see SMS System).
5. **Verification**: User provides the code. Backend checks the value in Redis.
6. **Flagging**: If correct, an `otp_verified:{phone}:{purpose}` flag is set for 30 minutes.
7. **Consumption**: The verified flag is consumed atomically when the final action (e.g., registration) is performed.

## Endpoints
- `/store/otp/request`: Trigger OTP generation and SMS sending.
- `/store/otp/verify`: Manually verify a code (often used in multi-step UIs).
- `/store/otp/reset-password`: Consumes OTP to set a new password.
- `/store/otp/change-password`: Consumes OTP to update current password.
- `/store/otp/change-phone`: Consumes OTP to update current phone.

## Security Features
- **Purpose Isolation**: An OTP for `reset_password` cannot be used for `register`.
- **Anti-Spam**: 60-second cooldown between requests per phone/purpose.
- **Rate Limiting**: (Implementation dependent) Standard Medusa rate limits apply.
- **Atomicity**: `otpStoreVerify` and `otpStoreConsumeVerified` use Lua scripts for thread-safe operations.
- **No Duplicate Registration**: OTP is not sent if `purpose=register` and the account already exists.
