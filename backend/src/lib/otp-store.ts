import crypto from "crypto"
import Redis from "ioredis"
import { 
  REDIS_URL, 
  OTP_RATE_LIMIT_PER_HOUR, 
} from "./constants"

/**
 * OTP State Keys (Redis):
 * - otp:{phone}              -> stores the 6-digit OTP code (TTL 15 min)
 * - otp_verified:{phone}     -> boolean flag indicating phone is verified (TTL 30 min)
 * - otp_attempts:{phone}     -> counter for rate limiting OTP requests (TTL 15 min)
 */

const KEY_PREFIX_OTP = "otp:"
const KEY_PREFIX_VERIFIED = "otp_verified:"
const KEY_PREFIX_ATTEMPTS = "otp_attempts:"

const TTL_OTP = 15 * 60 // 15 minutes
const TTL_VERIFIED = 30 * 60 // 30 minutes
const TTL_ATTEMPTS = 15 * 60 // 15 minutes

let redis: Redis | null = null

function getRedis(): Redis {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is not configured. Redis is required for OTP flow.")
  }
  if (!redis) {
    redis = new Redis(REDIS_URL)
  }
  return redis
}

export function generateOtpCode(): string {
  // 6-digit numeric code
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, "0")
}

/**
 * Sets the OTP code for a phone number.
 */
export async function otpStoreSet(phone: string, code: string): Promise<void> {
  const r = getRedis()
  const key = `${KEY_PREFIX_OTP}${phone}`
  await r.set(key, code, "EX", TTL_OTP)
}

/**
 * Verifies the OTP code for a phone number.
 * This is an ATOMIC operation using a Lua script.
 * If successful:
 * 1. Deletes the OTP key.
 * 2. Sets the verified flag key.
 */
export async function otpStoreVerify(phone: string, code: string): Promise<boolean> {
  const r = getRedis()
  const otpKey = `${KEY_PREFIX_OTP}${phone}`
  const verifiedKey = `${KEY_PREFIX_VERIFIED}${phone}`

  const luaScript = `
    local storedCode = redis.call('GET', KEYS[1])
    if storedCode == ARGV[1] then
      redis.call('DEL', KEYS[1])
      redis.call('SET', KEYS[2], 'true', 'EX', ARGV[2])
      return 1
    else
      return 0
    end
  `

  const result = await r.eval(luaScript, 2, otpKey, verifiedKey, code, TTL_VERIFIED)
  return result === 1
}

/**
 * Checks and increments the rate limit for OTP requests.
 * Returns true if the request is allowed.
 */
export async function otpRateLimitCheck(phone: string): Promise<boolean> {
  const r = getRedis()
  const key = `${KEY_PREFIX_ATTEMPTS}${phone}`

  const luaScript = `
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return count
  `

  const count = (await r.eval(luaScript, 1, key, TTL_ATTEMPTS)) as number
  return count <= OTP_RATE_LIMIT_PER_HOUR
}

/**
 * Consumes the verification flag for a phone number.
 * This is an ATOMIC one-time use operation.
 */
export async function otpStoreConsumeVerified(phone: string): Promise<boolean> {
  const r = getRedis()
  const key = `${KEY_PREFIX_VERIFIED}${phone}`

  // GETDEL is available in Redis 6.2+
  // If we want to be safe for older versions, use Lua.
  const luaScript = `
    local val = redis.call('GET', KEYS[1])
    if val then
      redis.call('DEL', KEYS[1])
      return 1
    else
      return 0
    end
  `

  const result = await r.eval(luaScript, 1, key)
  return result === 1
}


