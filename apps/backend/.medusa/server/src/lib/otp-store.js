"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpCode = generateOtpCode;
exports.otpCooldownCheck = otpCooldownCheck;
exports.otpStoreSet = otpStoreSet;
exports.otpStoreVerify = otpStoreVerify;
exports.otpRateLimitCheck = otpRateLimitCheck;
exports.otpStoreConsumeVerified = otpStoreConsumeVerified;
const crypto_1 = __importDefault(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
const constants_1 = require("./constants");
/**
 * OTP State Keys (Redis):
 * - otp:{phone}:{purpose}              -> stores the 6-digit OTP code (TTL 5 min)
 * - otp_verified:{phone}:{purpose}     -> boolean flag indicating phone is verified (TTL 30 min)
 * - otp_attempts:{phone}               -> counter for rate limiting OTP requests (TTL 15 min)
 * - otp_cooldown:{phone}:{purpose}     -> flag to prevent repeated SMS (TTL 60 sec)
 */
const KEY_PREFIX_OTP = "otp:";
const KEY_PREFIX_VERIFIED = "otp_verified:";
const KEY_PREFIX_ATTEMPTS = "otp_attempts:";
const KEY_PREFIX_COOLDOWN = "otp_cooldown:";
const KEY_PREFIX_VERIFY_ATTEMPTS = "otp_verify_attempts:";
const TTL_OTP = constants_1.OTP_TTL_SECONDS || 300; // Default 5 minutes
const TTL_VERIFIED = 30 * 60; // 30 minutes
const TTL_ATTEMPTS = 15 * 60; // 15 minutes
const TTL_COOLDOWN = 60; // 60 seconds
let redis = null;
function getRedis() {
    if (!constants_1.REDIS_URL) {
        throw new Error("REDIS_URL is not configured. Redis is required for OTP flow.");
    }
    if (!redis) {
        redis = new ioredis_1.default(constants_1.REDIS_URL);
    }
    return redis;
}
function generateOtpCode() {
    // 6-digit numeric code
    const n = crypto_1.default.randomInt(0, 1_000_000);
    return String(n).padStart(6, "0");
}
/**
 * Checks if phone is in cooldown for a specific purpose.
 * Returns true if allowed to send (not in cooldown).
 */
async function otpCooldownCheck(phone, purpose) {
    const r = getRedis();
    const key = `${KEY_PREFIX_COOLDOWN}${phone}:${purpose}`;
    const exists = await r.exists(key);
    return exists === 0;
}
/**
 * Sets the OTP code for a phone number and sets cooldown.
 */
async function otpStoreSet(phone, code, purpose) {
    const r = getRedis();
    const otpKey = `${KEY_PREFIX_OTP}${phone}:${purpose}`;
    const cooldownKey = `${KEY_PREFIX_COOLDOWN}${phone}:${purpose}`;
    await r.pipeline()
        .set(otpKey, code, "EX", TTL_OTP)
        .set(cooldownKey, "true", "EX", TTL_COOLDOWN)
        .exec();
}
/**
 * Verifies the OTP code for a phone number and purpose.
 * This is an ATOMIC operation using a Lua script.
 * If successful:
 * 1. Deletes the OTP key.
 * 2. Sets the verified flag key.
 */
async function otpStoreVerify(phone, code, purpose) {
    const r = getRedis();
    const otpKey = `${KEY_PREFIX_OTP}${phone}:${purpose}`;
    const verifiedKey = `${KEY_PREFIX_VERIFIED}${phone}:${purpose}`;
    const attemptKey = `${KEY_PREFIX_VERIFY_ATTEMPTS}${phone}:${purpose}`;
    const luaScript = `
    local storedCode = redis.call('GET', KEYS[1])
    if not storedCode then return 0 end

    if storedCode == ARGV[1] then
      redis.call('DEL', KEYS[1], KEYS[3])
      redis.call('SET', KEYS[2], 'true', 'EX', ARGV[2])
      return 1
    else
      local attempts = redis.call('INCR', KEYS[3])
      redis.call('EXPIRE', KEYS[3], 600) -- 10 min TTL for attempts
      if attempts >= tonumber(ARGV[3]) then
        redis.call('DEL', KEYS[1], KEYS[3])
      end
      return 0
    end
  `;
    const result = await r.eval(luaScript, 3, otpKey, verifiedKey, attemptKey, code, TTL_VERIFIED, constants_1.OTP_MAX_ATTEMPTS);
    return result === 1;
}
/**
 * Checks and increments the rate limit for OTP requests.
 * Returns true if the request is allowed.
 * Note: Rate limit is global per phone, not purpose-specific for better protection.
 */
async function otpRateLimitCheck(phone) {
    const r = getRedis();
    const key = `${KEY_PREFIX_ATTEMPTS}${phone}`;
    const luaScript = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `;
    const count = (await r.eval(luaScript, 1, key, TTL_ATTEMPTS));
    return count <= constants_1.OTP_RATE_LIMIT_PER_HOUR;
}
/**
 * Consumes the verification flag for a phone number and purpose.
 * This is an ATOMIC one-time use operation.
 */
async function otpStoreConsumeVerified(phone, purpose) {
    const r = getRedis();
    const key = `${KEY_PREFIX_VERIFIED}${phone}:${purpose}`;
    const luaScript = `
    local val = redis.call('GET', KEYS[1])
    if val then
      redis.call('DEL', KEYS[1])
      return 1
    else
      return 0
    end
  `;
    const result = await r.eval(luaScript, 1, key);
    return result === 1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3RwLXN0b3JlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9vdHAtc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUF3Q0EsMENBSUM7QUFNRCw0Q0FLQztBQUtELGtDQVNDO0FBU0Qsd0NBMEJDO0FBT0QsOENBY0M7QUFNRCwwREFnQkM7QUFuSkQsb0RBQTJCO0FBQzNCLHNEQUEyQjtBQUMzQiwyQ0FLb0I7QUFFcEI7Ozs7OztHQU1HO0FBRUgsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFBO0FBQzdCLE1BQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBQzNDLE1BQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBQzNDLE1BQU0sbUJBQW1CLEdBQUcsZUFBZSxDQUFBO0FBQzNDLE1BQU0sMEJBQTBCLEdBQUcsc0JBQXNCLENBQUE7QUFFekQsTUFBTSxPQUFPLEdBQUcsMkJBQWUsSUFBSSxHQUFHLENBQUEsQ0FBQyxvQkFBb0I7QUFDM0QsTUFBTSxZQUFZLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQSxDQUFDLGFBQWE7QUFDMUMsTUFBTSxZQUFZLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQSxDQUFDLGFBQWE7QUFDMUMsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBLENBQUMsYUFBYTtBQUVyQyxJQUFJLEtBQUssR0FBaUIsSUFBSSxDQUFBO0FBRTlCLFNBQVMsUUFBUTtJQUNmLElBQUksQ0FBQyxxQkFBUyxFQUFFLENBQUM7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUE7SUFDakYsQ0FBQztJQUNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLEtBQUssR0FBRyxJQUFJLGlCQUFLLENBQUMscUJBQVMsQ0FBQyxDQUFBO0lBQzlCLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQTtBQUNkLENBQUM7QUFFRCxTQUFnQixlQUFlO0lBQzdCLHVCQUF1QjtJQUN2QixNQUFNLENBQUMsR0FBRyxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDeEMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNuQyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxPQUFlO0lBQ25FLE1BQU0sQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFBO0lBQ3BCLE1BQU0sR0FBRyxHQUFHLEdBQUcsbUJBQW1CLEdBQUcsS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBQ3ZELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNsQyxPQUFPLE1BQU0sS0FBSyxDQUFDLENBQUE7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLFdBQVcsQ0FBQyxLQUFhLEVBQUUsSUFBWSxFQUFFLE9BQWU7SUFDNUUsTUFBTSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUE7SUFDcEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxjQUFjLEdBQUcsS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBQ3JELE1BQU0sV0FBVyxHQUFHLEdBQUcsbUJBQW1CLEdBQUcsS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBRS9ELE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRTtTQUNmLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUM7U0FDaEMsR0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQztTQUM1QyxJQUFJLEVBQUUsQ0FBQTtBQUNYLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUFDLEtBQWEsRUFBRSxJQUFZLEVBQUUsT0FBZTtJQUMvRSxNQUFNLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQTtJQUNwQixNQUFNLE1BQU0sR0FBRyxHQUFHLGNBQWMsR0FBRyxLQUFLLElBQUksT0FBTyxFQUFFLENBQUE7SUFDckQsTUFBTSxXQUFXLEdBQUcsR0FBRyxtQkFBbUIsR0FBRyxLQUFLLElBQUksT0FBTyxFQUFFLENBQUE7SUFDL0QsTUFBTSxVQUFVLEdBQUcsR0FBRywwQkFBMEIsR0FBRyxLQUFLLElBQUksT0FBTyxFQUFFLENBQUE7SUFFckUsTUFBTSxTQUFTLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQmpCLENBQUE7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLDRCQUFnQixDQUFDLENBQUE7SUFDaEgsT0FBTyxNQUFNLEtBQUssQ0FBQyxDQUFBO0FBQ3JCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0ksS0FBSyxVQUFVLGlCQUFpQixDQUFDLEtBQWE7SUFDbkQsTUFBTSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUE7SUFDcEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxtQkFBbUIsR0FBRyxLQUFLLEVBQUUsQ0FBQTtJQUU1QyxNQUFNLFNBQVMsR0FBRzs7Ozs7O0dBTWpCLENBQUE7SUFFRCxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBVyxDQUFBO0lBQ3ZFLE9BQU8sS0FBSyxJQUFJLG1DQUF1QixDQUFBO0FBQ3pDLENBQUM7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsdUJBQXVCLENBQUMsS0FBYSxFQUFFLE9BQWU7SUFDMUUsTUFBTSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUE7SUFDcEIsTUFBTSxHQUFHLEdBQUcsR0FBRyxtQkFBbUIsR0FBRyxLQUFLLElBQUksT0FBTyxFQUFFLENBQUE7SUFFdkQsTUFBTSxTQUFTLEdBQUc7Ozs7Ozs7O0dBUWpCLENBQUE7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUM5QyxPQUFPLE1BQU0sS0FBSyxDQUFDLENBQUE7QUFDckIsQ0FBQyJ9