import crypto from "crypto"
import Redis from "ioredis"
import { 
  REDIS_URL, 
  COOKIE_SECRET, 
  OTP_TTL_SECONDS, 
  OTP_MAX_ATTEMPTS, 
  OTP_RATE_LIMIT_PER_HOUR, 
  OTP_SECRET 
} from "./constants"

export type OtpPurpose = "register" | "reset_password" | "change_password"

type StoredOtp = {
  hash: string
  created_at: number
  attempts: number
}

function otpKey(purpose: OtpPurpose, phone: string) {
  return `otp:${purpose}:${phone}`
}

function rateKey(purpose: OtpPurpose, phone: string) {
  return `otp:rl:${purpose}:${phone}`
}

function otpSecret(): string {
  return OTP_SECRET || COOKIE_SECRET || "otp_secret"
}

export function generateOtpCode(): string {
  // 6-digit numeric code
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, "0")
}

function hashOtp(purpose: OtpPurpose, phone: string, code: string) {
  return crypto
    .createHash("sha256")
    .update(`${otpSecret()}:${purpose}:${phone}:${code}`)
    .digest("hex")
}

let redis: Redis | null = null
function getRedis(): Redis | null {
  if (!REDIS_URL) return null
  if (!redis) {
    redis = new Redis(REDIS_URL)
  }
  return redis
}

// In-memory fallback (dev only)
const mem = new Map<string, { value: StoredOtp; expiresAt: number }>()
const memRate = new Map<string, { count: number; expiresAt: number }>()

export async function otpStoreSet(purpose: OtpPurpose, phone: string, code: string) {
  const now = Date.now()
  const payload: StoredOtp = { hash: hashOtp(purpose, phone, code), created_at: now, attempts: 0 }

  const r = getRedis()
  if (r) {
    await r.set(otpKey(purpose, phone), JSON.stringify(payload), "EX", OTP_TTL_SECONDS)
    return
  }

  mem.set(otpKey(purpose, phone), { value: payload, expiresAt: now + OTP_TTL_SECONDS * 1000 })
}

export async function otpStoreVerify(purpose: OtpPurpose, phone: string, code: string): Promise<boolean> {
  const r = getRedis()
  const key = otpKey(purpose, phone)

  const expectedHash = hashOtp(purpose, phone, code)

  const read = async (): Promise<StoredOtp | null> => {
    if (r) {
      const raw = await r.get(key)
      return raw ? (JSON.parse(raw) as StoredOtp) : null
    }
    const item = mem.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      mem.delete(key)
      return null
    }
    return item.value
  }

  const write = async (val: StoredOtp | null) => {
    if (r) {
      if (!val) {
        await r.del(key)
        return
      }
      // preserve remaining TTL if possible
      const ttl = await r.ttl(key)
      await r.set(key, JSON.stringify(val), "EX", Math.max(1, ttl > 0 ? ttl : OTP_TTL_SECONDS))
      return
    }
    if (!val) {
      mem.delete(key)
      return
    }
    const existing = mem.get(key)
    const expiresAt = existing?.expiresAt ?? Date.now() + OTP_TTL_SECONDS * 1000
    mem.set(key, { value: val, expiresAt })
  }

  const current = await read()
  if (!current) return false

  if (current.attempts >= OTP_MAX_ATTEMPTS) {
    await write(null)
    return false
  }

  const ok = crypto.timingSafeEqual(Buffer.from(current.hash), Buffer.from(expectedHash))
  if (!ok) {
    await write({ ...current, attempts: current.attempts + 1 })
    return false
  }

  // Success: consume OTP
  await write(null)
  return true
}

export async function otpRateLimitCheck(purpose: OtpPurpose, phone: string): Promise<boolean> {
  const r = getRedis()
  const key = rateKey(purpose, phone)

  if (r) {
    const count = await r.incr(key)
    if (count === 1) {
      await r.expire(key, 60 * 60)
    }
    return count <= OTP_RATE_LIMIT_PER_HOUR
  }

  // naive in-memory rate limit
  const now = Date.now()
  const existing = memRate.get(key)
  if (!existing || now > existing.expiresAt) {
    memRate.set(key, { count: 1, expiresAt: now + 60 * 60 * 1000 })
    return true
  }

  existing.count += 1
  return existing.count <= OTP_RATE_LIMIT_PER_HOUR
}


