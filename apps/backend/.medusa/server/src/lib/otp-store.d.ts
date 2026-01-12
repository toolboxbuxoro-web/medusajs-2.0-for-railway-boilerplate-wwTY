export declare function generateOtpCode(): string;
/**
 * Checks if phone is in cooldown for a specific purpose.
 * Returns true if allowed to send (not in cooldown).
 */
export declare function otpCooldownCheck(phone: string, purpose: string): Promise<boolean>;
/**
 * Sets the OTP code for a phone number and sets cooldown.
 */
export declare function otpStoreSet(phone: string, code: string, purpose: string): Promise<void>;
/**
 * Verifies the OTP code for a phone number and purpose.
 * This is an ATOMIC operation using a Lua script.
 * If successful:
 * 1. Deletes the OTP key.
 * 2. Sets the verified flag key.
 */
export declare function otpStoreVerify(phone: string, code: string, purpose: string): Promise<boolean>;
/**
 * Checks and increments the rate limit for OTP requests.
 * Returns true if the request is allowed.
 * Note: Rate limit is global per phone, not purpose-specific for better protection.
 */
export declare function otpRateLimitCheck(phone: string): Promise<boolean>;
/**
 * Consumes the verification flag for a phone number and purpose.
 * This is an ATOMIC one-time use operation.
 */
export declare function otpStoreConsumeVerified(phone: string, purpose: string): Promise<boolean>;
