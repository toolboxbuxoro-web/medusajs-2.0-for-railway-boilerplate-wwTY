import { Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import Redis from "ioredis"

export interface BtsCalculateParams {
  senderCityId: number
  senderPointId?: number // Optional specific point ID (e.g., Raymag 263)
  receiverCityId: number
  weight: number
  volume?: number | null
  senderDelivery: 0 | 1 // 1 = courier pickup, 0 = office
  receiverDelivery: 0 | 1 // 1 = courier delivery, 0 = office
}

export interface BtsCalculateResponse {
  success?: boolean
  summaryPrice?: number
  data?: {
    summaryPrice: number
    basePrice?: number
    courierPickup?: number
    courierDelivery?: number
  }
  error?: string
  message?: string
}

export interface BtsBranch {
  id: number
  name: string
  cityId: number
  regionId: number
  address: string
  lat_long?: string
}

export interface BtsRegionGroup {
  id: string
  name: string
  nameRu: string
  zone: 1 | 2 | 3
  points: { id: string; name: string; address: string; city_id: number }[]
}

// Circuit breaker state (static, shared across instances)
interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
}

// Metrics for observability
export interface BtsMetrics {
  requestsTotal: number
  requestsSuccess: number
  requestsFailed: number
  cacheHits: number
  cacheMisses: number
  fallbackUsage: number
  circuitBreakerTrips: number
  lastRequestLatencyMs: number
  avgLatencyMs: number
  totalLatencyMs: number
}

export class BtsApiService {
  protected logger: Logger
  protected baseUrl: string = "http://api.bts.uz:8080/index.php"
  protected credentials: {
    login: string
    pass: string
    inn: string
  }
  
  // Static caches shared across service instances
  protected static cachedToken: { token: string; expires: number } | null = null
  protected static tokenRefreshPromise: Promise<string> | null = null
  protected static circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
  }
  
  // Configuration
  protected readonly TIMEOUT_MS = 8000
  protected readonly MAX_RETRIES = 2
  protected readonly CACHE_TTL_SECONDS = 900 // 15 minutes
  protected readonly CIRCUIT_BREAKER_THRESHOLD = 5
  protected readonly CIRCUIT_BREAKER_RESET_MS = 60000 // 1 minute

  // Redis client (lazy initialized)
  protected static redis: Redis | null = null

  // Metrics (static, shared across instances)
  protected static metrics: BtsMetrics = {
    requestsTotal: 0,
    requestsSuccess: 0,
    requestsFailed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    fallbackUsage: 0,
    circuitBreakerTrips: 0,
    lastRequestLatencyMs: 0,
    avgLatencyMs: 0,
    totalLatencyMs: 0,
  }

  constructor(logger: Logger) {
    this.logger = logger
    
    const login = process.env.BTS_LOGIN
    const pass = process.env.BTS_PASSWORD
    const inn = process.env.BTS_INN

    if (!login || !pass || !inn) {
      this.logger.warn("[BTS API] Missing credentials in environment variables (BTS_LOGIN, BTS_PASSWORD, BTS_INN)")
    }

    this.credentials = {
      login: login || "",
      pass: pass || "",
      inn: inn || "",
    }
  }

  /**
   * Get Redis client (lazy initialization)
   */
  protected getRedis(): Redis | null {
    if (BtsApiService.redis) return BtsApiService.redis
    
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      this.logger.warn("[BTS API] REDIS_URL not configured, price caching disabled")
      return null
    }
    
    try {
      BtsApiService.redis = new Redis(redisUrl)
      return BtsApiService.redis
    } catch (err: any) {
      this.logger.error(`[BTS API] Failed to connect to Redis: ${err.message}`)
      return null
    }
  }

  /**
   * Helper: sleep for given ms
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Wrapper for fetch with timeout
   */
  protected async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `BTS API request timed out after ${this.TIMEOUT_MS}ms`)
      }
      throw error
    } finally {
      clearTimeout(id)
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  protected async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options)
      } catch (error: any) {
        lastError = error
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
          this.logger.warn(`[BTS API] Retry ${attempt + 1}/${this.MAX_RETRIES} after ${delay}ms: ${error.message}`)
          await this.sleep(delay)
        }
      }
    }
    
    throw lastError
  }

  /**
   * Check circuit breaker state
   */
  protected isCircuitOpen(): boolean {
    const cb = BtsApiService.circuitBreaker
    
    if (!cb.isOpen) return false
    
    // Check if reset period has passed
    if (Date.now() - cb.lastFailure > this.CIRCUIT_BREAKER_RESET_MS) {
      this.logger.info("[BTS API] Circuit breaker reset (half-open)")
      cb.isOpen = false
      cb.failures = 0
      return false
    }
    
    return true
  }

  /**
   * Record a failure for circuit breaker
   */
  protected recordFailure(): void {
    const cb = BtsApiService.circuitBreaker
    cb.failures++
    cb.lastFailure = Date.now()
    
    if (cb.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      cb.isOpen = true
      this.logger.error(`[BTS API] Circuit breaker OPEN after ${cb.failures} failures`)
    }
  }

  /**
   * Record success (reset failures)
   */
  protected recordSuccess(): void {
    BtsApiService.circuitBreaker.failures = 0
  }

  /**
   * Get cached price from Redis
   */
  protected async getCachedPrice(cacheKey: string): Promise<number | null> {
    const redis = this.getRedis()
    if (!redis) return null
    
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        this.logger.debug(`[BTS API] Cache HIT: ${cacheKey}`)
        return parseInt(cached, 10)
      }
    } catch (err: any) {
      if (process.env.BTS_DEBUG === "true") {
        this.logger.warn(`[BTS API] Redis get error: ${err.message}`)
      }
    }
    
    return null
  }

  /**
   * Set cached price in Redis
   */
  protected async setCachedPrice(cacheKey: string, price: number): Promise<void> {
    const redis = this.getRedis()
    if (!redis) return
    
    try {
      await redis.setex(cacheKey, this.CACHE_TTL_SECONDS, price.toString())
      this.logger.debug(`[BTS API] Cache SET: ${cacheKey} = ${price}`)
    } catch (err: any) {
      if (process.env.BTS_DEBUG === "true") {
        this.logger.warn(`[BTS API] Redis set error: ${err.message}`)
      }
    }
  }

  /**
   * Generate cache key for price calculation
   */
  protected getCacheKey(params: BtsCalculateParams): string {
    // Round weight to 1 decimal to group similar weights
    const roundedWeight = Math.round(params.weight * 10) / 10
    return `bts:price:${params.senderCityId}:${params.receiverCityId}:${roundedWeight}:${params.senderDelivery}:${params.receiverDelivery}`
  }

  private async getToken(): Promise<string> {
    if (BtsApiService.cachedToken && BtsApiService.cachedToken.expires > Date.now()) {
      return BtsApiService.cachedToken.token
    }

    if (!this.credentials.login || !this.credentials.pass) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "BTS API credentials not configured")
    }

    // Prevent race conditions with a lock
    if (BtsApiService.tokenRefreshPromise) {
      return BtsApiService.tokenRefreshPromise
    }

    this.logger.info("[BTS API] Fetching new auth token")
    
    BtsApiService.tokenRefreshPromise = (async () => {
      try {
        const resp = await this.fetchWithRetry(`${this.baseUrl}?r=v1/auth/get-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.credentials.login,
            password: this.credentials.pass,
            inn: this.credentials.inn,
          }),
        })

        if (!resp.ok) {
          const text = await resp.text().catch(() => "")
          this.logger.error(`[BTS API] Auth failed: ${resp.status} ${text}`)
          throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `BTS Auth failed (${resp.status})`)
        }

        const json = (await resp.json()) as any
        const token = json?.data?.token

        this.logger.info(`[BTS API] Auth Response status: ${resp.status}`)
        if (token) {
          this.logger.info(`[BTS API] Successfully obtained token (starts with: ${token.substring(0, 10)}...)`)
        }

        if (!token) {
          this.logger.error(`[BTS API] Token missing in response: ${JSON.stringify(json)}`)
          throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "BTS token missing in response")
        }

        // Cache for 1 hour (static) with 5 min buffer
        BtsApiService.cachedToken = {
          token,
          expires: Date.now() + 3600 * 1000 - 300 * 1000, 
        }

        return token
      } catch (error: any) {
         this.logger.error(`[BTS API] Token fetch error: ${error.message}`)
         throw error
      } finally {
        BtsApiService.tokenRefreshPromise = null
      }
    })()

    return BtsApiService.tokenRefreshPromise
  }

  async calculate(params: BtsCalculateParams): Promise<number> {
    const startTime = Date.now()
    BtsApiService.metrics.requestsTotal++

    // 1. Check circuit breaker
    if (this.isCircuitOpen()) {
      this.logger.warn("[BTS API] Circuit breaker is OPEN, skipping API call")
      BtsApiService.metrics.circuitBreakerTrips++
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "BTS API temporarily unavailable (circuit open)")
    }

    // 2. Check Redis cache
    const cacheKey = this.getCacheKey(params)
    const cachedPrice = await this.getCachedPrice(cacheKey)
    if (cachedPrice !== null) {
      BtsApiService.metrics.cacheHits++
      return cachedPrice
    }
    BtsApiService.metrics.cacheMisses++

    // 3. Get token and call API
    try {
      const token = await this.getToken()

      this.logger.info(`[BTS API] Calculating cost for weight ${params.weight} from ${params.senderCityId} to ${params.receiverCityId}`)

      this.logger.info(`[BTS API] REQUEST: POST ${this.baseUrl}?r=v1/order/calculate`)
      this.logger.info(`[BTS API] PAYLOAD: ${JSON.stringify(params)}`)

      const resp = await this.fetchWithRetry(`${this.baseUrl}?r=v1/order/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      })

      this.logger.info(`[BTS API] RESPONSE STATUS: ${resp.status}`)

      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        this.logger.error(`[BTS API] Calculation failed: ${resp.status} ${text}`)
        this.recordFailure()
        BtsApiService.metrics.requestsFailed++
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `BTS Calculation failed (${resp.status})`)
      }

      const json = (await resp.json()) as BtsCalculateResponse
      
      this.logger.info(`[BTS API] RAW RESPONSE BODY: ${JSON.stringify(json)}`)

      // Flexible parsing: try root level first, then data object
      const price = json.summaryPrice ?? json.data?.summaryPrice

      if (price === undefined || price === null) {
        this.logger.error(`[BTS API] Calculation response missing price: ${JSON.stringify(json)}`)
        this.recordFailure()
        BtsApiService.metrics.requestsFailed++
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE, 
          json.error || json.message || "BTS calculation failed: missing price in response"
        )
      }
      await this.setCachedPrice(cacheKey, price)
      
      // 5. Record success
      this.recordSuccess()
      BtsApiService.metrics.requestsSuccess++

      // 6. Record latency
      const latency = Date.now() - startTime
      BtsApiService.metrics.lastRequestLatencyMs = latency
      BtsApiService.metrics.totalLatencyMs += latency
      BtsApiService.metrics.avgLatencyMs = Math.round(
        BtsApiService.metrics.totalLatencyMs / BtsApiService.metrics.requestsTotal
      )

      return price
    } catch (error: any) {
      this.recordFailure()
      BtsApiService.metrics.requestsFailed++
      throw error
    }
  }

  /**
   * Get list of cities from BTS API
   */
  async getCities(): Promise<any[]> {
    const cacheKey = "bts:cities"
    const redis = this.getRedis()
    
    // 1. Try Redis cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          this.logger.debug("[BTS API] Cities cache HIT")
          return JSON.parse(cached)
        }
      } catch (err: any) {
        this.logger.warn(`[BTS API] Redis get error: ${err.message}`)
      }
    }

    // 2. Fetch from API
    try {
      const token = await this.getToken()
      this.logger.info("[BTS API] Fetching cities list")

      const resp = await this.fetchWithRetry(`${this.baseUrl}?r=v1/directory/cities`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!resp.ok) {
        throw new Error(`Failed to fetch cities: ${resp.status}`)
      }

      const json = (await resp.json()) as any
      const cities = json?.data || []

      // 3. Cache result (24 hours)
      if (redis && cities.length > 0) {
        try {
          await redis.setex(cacheKey, 86400, JSON.stringify(cities))
        } catch (err: any) {
          this.logger.warn(`[BTS API] Redis set error: ${err.message}`)
        }
      }

      return cities
    } catch (error: any) {
      this.logger.error(`[BTS API] Failed to get cities: ${error.message}`)
      // Fallback to basic map if API fails
      return this.getFallbackCities()
    }
  }

  protected getFallbackCities() {
    return [
      { id: 101, name: "Ташкент", region_id: "tashkent-city" },
      { id: 45, name: "Самарканд", region_id: "samarkand" },
      { id: 40, name: "Бухара", region_id: "bukhara" },
      { id: 86, name: "Фергана", region_id: "fergana" },
      { id: 95, name: "Наманган", region_id: "namangan" },
      { id: 36, name: "Андижан", region_id: "andijan" },
      { id: 41, name: "Карши", region_id: "kashkadarya" },
      { id: 102, name: "Термез", region_id: "surkhandarya" },
      { id: 54, name: "Навои", region_id: "navoi" },
      { id: 38, name: "Джизак", region_id: "jizzakh" },
      { id: 37, name: "Гулистан", region_id: "syrdarya" },
      { id: 104, name: "Ургенч", region_id: "khorezm" },
      { id: 56, name: "Нукус", region_id: "karakalpakstan" },
    ]
  }

  /**
   * Maps internal region IDs to BTS city IDs
   */
  mapRegionToCityId(regionId: string): number {
    const mapping: Record<string, number> = {
      "tashkent-city": 101,
      "tashkent-region": 101,
      "samarkand": 45,
      "bukhara": 40,
      "fergana": 86,
      "namangan": 95,
      "andijan": 36,
      "kashkadarya": 41,
      "surkhandarya": 102,
      "navoi": 54,
      "jizzakh": 38,
      "syrdarya": 37,
      "khorezm": 104,
      "karakalpakstan": 56,
    }

    return mapping[regionId] || 101
  }

  /**
   * Get current metrics snapshot (static)
   */
  static getMetrics(): BtsMetrics {
    return { ...BtsApiService.metrics }
  }

  /**
   * Reset all metrics (static)
   */
  static resetMetrics(): void {
    BtsApiService.metrics = {
      requestsTotal: 0,
      requestsSuccess: 0,
      requestsFailed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fallbackUsage: 0,
      circuitBreakerTrips: 0,
      lastRequestLatencyMs: 0,
      avgLatencyMs: 0,
      totalLatencyMs: 0,
    }
  }

  /**
   * Get circuit breaker status
   */
  static getCircuitBreakerStatus(): { isOpen: boolean; failures: number } {
    return {
      isOpen: BtsApiService.circuitBreaker.isOpen,
      failures: BtsApiService.circuitBreaker.failures,
    }
  }

  /**
   * Increment fallback usage metric
   */
  static incrementFallbackUsage(): void {
    BtsApiService.metrics.fallbackUsage++
  }

  /**
   * Internal mapping of BTS Region IDs to our system IDs
   */
  protected regionIdMap: Record<number, string> = {
    6: "tashkent-city",
    5: "tashkent-region",
    8: "samarkand",
    7: "bukhara",
    15: "fergana",
    3: "namangan",
    2: "andijan",
    14: "kashkadarya",
    13: "surkhandarya",
    10: "navoi",
    9: "jizzakh",
    12: "syrdarya",
    4: "khorezm",
    11: "karakalpakstan"
  }

  protected regionConfig: Record<string, {name: string, nameRu: string, zone: 1 | 2 | 3}> = {
    "tashkent-city": { name: "Toshkent shahri", nameRu: "Ташкент (Город)", zone: 2 },
    "tashkent-region": { name: "Toshkent viloyati", nameRu: "Ташкентская область", zone: 2 },
    "samarkand": { name: "Samarqand viloyati", nameRu: "Самаркандская область", zone: 1 },
    "bukhara": { name: "Buxoro viloyati", nameRu: "Бухарская область", zone: 1 },
    "fergana": { name: "Farg'ona viloyati", nameRu: "Ферганская область", zone: 3 },
    "namangan": { name: "Namangan viloyati", nameRu: "Наманганская область", zone: 3 },
    "andijan": { name: "Andijon viloyati", nameRu: "Андижанская область", zone: 3 },
    "kashkadarya": { name: "Qashqadaryo viloyati", nameRu: "Кашкадарьинская область", zone: 1 },
    "surkhandarya": { name: "Surxondaryo viloyati", nameRu: "Сурхандарьинская область", zone: 2 },
    "navoi": { name: "Navoiy viloyati", nameRu: "Навоийская область", zone: 1 },
    "jizzakh": { name: "Jizzax viloyati", nameRu: "Джизакская область", zone: 1 },
    "syrdarya": { name: "Sirdaryo viloyati", nameRu: "Сырдарьинская область", zone: 2 },
    "khorezm": { name: "Xorazm viloyati", nameRu: "Хорезмская область", zone: 2 },
    "karakalpakstan": { name: "Qoraqalpog'iston", nameRu: "Каракалпакстан", zone: 2 },
  }

  /**
   * Get dynamic list of branches from BTS API
   * Caches result for 24 hours
   */
  async getBranches(): Promise<BtsRegionGroup[]> {
    const cacheKey = "bts:branches:grouped:v1"
    const redis = this.getRedis()
    
    // 1. Try Redis
    if (redis) {
      try {
        const cached = await redis.get(cacheKey)
        if (cached) {
          this.logger.debug("[BTS API] Branches cache HIT")
          return JSON.parse(cached)
        }
      } catch (err: any) {
        this.logger.warn(`[BTS API] Redis get error: ${err.message}`)
      }
    }

    try {
      const token = await this.getToken()
      this.logger.info("[BTS API] Fetching branches list")

      const resp = await this.fetchWithRetry(`${this.baseUrl}?r=directory/branches`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!resp.ok) throw new Error("Failed to fetch branches")
      
      const json = await resp.json()
      const rawBranches: any[] = json.data || []

      // Group by region
      const grouped: Record<string, any[]> = {}
      
      // Initialize groups
      Object.keys(this.regionConfig).forEach(k => grouped[k] = [])

      rawBranches.forEach(b => {
        const regionKey = this.regionIdMap[b.regionId]
        if (regionKey && grouped[regionKey]) {
          grouped[regionKey].push({
            id: b.id.toString(), // Keep as string for Select compatibility
            name: b.name,
            address: b.address || b.address_ru || b.name,
            city_id: b.cityId // IMPORTANT: This is the ID for calculation
          })
        }
      })

      // Convert to array
      const result: BtsRegionGroup[] = Object.entries(this.regionConfig).map(([key, config]) => ({
        id: key,
        name: config.name,
        nameRu: config.nameRu,
        zone: config.zone,
        points: grouped[key] || []
      }))

      // Cache for 24 hours
      if (redis) {
        await redis.setex(cacheKey, 86400, JSON.stringify(result))
      }

      return result
    } catch (e: any) {
      this.logger.error(`[BTS API] Get Branches Error: ${e.message}`)
      throw e
    }
  }
}
