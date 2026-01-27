import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BtsApiService } from "../../../lib/bts-api"

/**
 * BTS Express Uzbekistan - Official Tariff Card 2025
 * Source: bts.uz/documenty/ru/xizmatlarining-tarif-karta/2025-01-10
 */

export interface BtsPoint {
  id: string
  name: string
  address: string
  coordinates?: { lat: number; lng: number }
}

export interface BtsRegion {
  id: string
  name: string
  nameRu: string
  zone: 1 | 2 | 3
  points: BtsPoint[]
}

// Official BTS pricing configuration (Tariff Card 2025)
export const BTS_PRICING = {
  zoneRates: {
    1: 5000,
    2: 6000,
    3: 6500,
  } as Record<1 | 2 | 3, number>,
  
  expressRates: {
    1: { 1: 28000, 2: 33000, 3: 38000 },
    2: { 1: 33000, 2: 38000, 3: 43000 },
    3: { 1: 38000, 2: 43000, 3: 48000 },
    5: { 1: 48000, 2: 58000, 3: 63000 },
    10: { 1: 75000, 2: 96000, 3: 105000 },
    15: { 1: 105000, 2: 129000, 3: 145000 },
    20: { 1: 130000, 2: 160000, 3: 180000 },
  } as Record<number, Record<1 | 2 | 3, number>>,
  
  expressMaxWeight: 20,
  minWeight: 1,
  courierPickupFee: 30000,
  courierDeliveryFee: 30000,
  heavyWeightThreshold: 50,
  heavyWeightCoefficient: 1.3,
  winterMonths: [12, 1, 2, 3],
  winterFuelSurcharge: 0.30,
  insuranceRate: 0.005,
}

// All BTS regions with pickup points
export const BTS_REGIONS: BtsRegion[] = [
  {
    id: "tashkent-city",
    name: "Toshkent shahri",
    nameRu: "Ташкент",
    zone: 2,
    points: [
      { id: "yakkasaroy-1", name: "Yakkasaroy #1", address: "Yakkasaroy tumani" },
      { id: "yakkasaroy-2", name: "Yakkasaroy #2", address: "Yakkasaroy tumani" },
      { id: "yakkasaroy-3", name: "Yakkasaroy #3", address: "Yakkasaroy tumani" },
      { id: "uchtepa-1", name: "Uchtepa #1", address: "Uchtepa tumani" },
      { id: "uchtepa-2", name: "Uchtepa #2", address: "Uchtepa tumani" },
      { id: "chilonzor-1", name: "Chilonzor #1", address: "Chilonzor tumani" },
      { id: "chilonzor-2", name: "Chilonzor #2", address: "Chilonzor tumani" },
      { id: "chilonzor-3", name: "Chilonzor #3", address: "Chilonzor tumani" },
      { id: "yunusobod-1", name: "Yunusobod #1", address: "Yunusobod tumani" },
      { id: "yunusobod-2", name: "Yunusobod #2", address: "Yunusobod tumani" },
      { id: "sergeli-1", name: "Sergeli #1", address: "Sergeli tumani" },
      { id: "mirobod-1", name: "Mirobod #1", address: "Mirobod tumani" },
      { id: "olmazor-1", name: "Olmazor #1", address: "Olmazor tumani" },
      { id: "shayxontohur-1", name: "Shayxontohur #1", address: "Shayxontohur tumani" },
      { id: "ulugbek-1", name: "M.Ulug'bek #1", address: "M.Ulug'bek tumani" },
      { id: "yashnobod-1", name: "Yashnobod #1", address: "Yashnobod tumani" },
      { id: "yangihayot-1", name: "Yangihayot #1", address: "Yangihayot tumani" },
    ],
  },
  {
    id: "tashkent-region",
    name: "Toshkent viloyati",
    nameRu: "Ташкентская область",
    zone: 2,
    points: [
      { id: "chirchiq-1", name: "Chirchiq #1", address: "Chirchiq shahri" },
      { id: "chirchiq-2", name: "Chirchiq #2", address: "Chirchiq shahri" },
      { id: "olmaliq-1", name: "Olmaliq #1", address: "Olmaliq shahri" },
      { id: "angren-1", name: "Angren #1", address: "Angren shahri" },
      { id: "oqqorgon-1", name: "Oqqo'rg'on #1", address: "Oqqo'rg'on tuman" },
      { id: "yangiyol-1", name: "Yangiyo'l #1", address: "Yangiyo'l shahar" },
      { id: "bekobod-1", name: "Bekobod #1", address: "Bekobod shahri" },
      { id: "nurafshon-1", name: "Nurafshon #1", address: "Nurafshon shahri" },
      { id: "qibray-1", name: "Qibray #1", address: "Qibray tumani" },
      { id: "parkent-1", name: "Parkent #1", address: "Parkent tuman" },
      { id: "gazalkent-1", name: "G'azalkent #1", address: "G'azalkent shahri" },
    ],
  },
  {
    id: "samarkand",
    name: "Samarqand viloyati",
    nameRu: "Самаркандская область",
    zone: 1,
    points: [
      { id: "samarkand-city-1", name: "Samarqand #1", address: "Samarqand shahri" },
      { id: "kattaqorgon-1", name: "Kattaqo'rg'on #1", address: "Kattaqo'rg'on shahri" },
      { id: "urgut-1", name: "Urgut #1", address: "Urgut tumani" },
      { id: "jomboy-1", name: "Jomboy #1", address: "Jomboy tuman" },
      { id: "payariq-1", name: "Payariq #1", address: "Payariq tuman" },
      { id: "oqdaryo-1", name: "Oqdaryo #1", address: "Oqdaryo tumani" },
    ],
  },
  {
    id: "bukhara",
    name: "Buxoro viloyati",
    nameRu: "Бухарская область",
    zone: 1,
    points: [
      { id: "bukhara-city-1", name: "Buxoro #1", address: "Buxoro shahar" },
      { id: "kogon-1", name: "Kogon #1", address: "Kogon shahar" },
      { id: "vobkent-1", name: "Vobkent #1", address: "Vobkent tumani" },
      { id: "gijduvon-1", name: "G'ijduvon #1", address: "G'ijduvon tumani" },
      { id: "jondor-1", name: "Jondor #1", address: "Jondor tuman" },
    ],
  },
  {
    id: "fergana",
    name: "Farg'ona viloyati",
    nameRu: "Ферганская область",
    zone: 3,
    points: [
      { id: "fergana-city-1", name: "Farg'ona #1", address: "Farg'ona shahri" },
      { id: "qoqon-1", name: "Qo'qon #1", address: "Qo'qon shahar" },
      { id: "margilon-1", name: "Marg'ilon #1", address: "Marg'ilon shahar" },
      { id: "quvasoy-1", name: "Quvasoy #1", address: "Quvasoy shahar" },
      { id: "rishton-1", name: "Rishton #1", address: "Rishton tuman" },
      { id: "beshariq-1", name: "Beshariq #1", address: "Beshariq tuman" },
    ],
  },
  {
    id: "namangan",
    name: "Namangan viloyati",
    nameRu: "Наманганская область",
    zone: 3,
    points: [
      { id: "namangan-city-1", name: "Namangan #1", address: "Namangan shahar" },
      { id: "chust-1", name: "Chust #1", address: "Chust tumani" },
      { id: "uchqorgon-1", name: "Uchqo'rg'on #1", address: "Uchqo'rg'on tumani" },
      { id: "pop-1", name: "Pop #1", address: "Pop tumani" },
      { id: "chortoq-1", name: "Chortoq #1", address: "Chortoq tumani" },
    ],
  },
  {
    id: "andijan",
    name: "Andijon viloyati",
    nameRu: "Андижанская область",
    zone: 3,
    points: [
      { id: "andijan-city-1", name: "Andijon #1", address: "Andijon shahri" },
      { id: "asaka-1", name: "Asaka #1", address: "Asaka tuman" },
      { id: "shahrixon-1", name: "Shaxrixon #1", address: "Shaxrixon tuman" },
      { id: "xonobod-1", name: "Xonobod #1", address: "Xonobod shahar" },
    ],
  },
  {
    id: "kashkadarya",
    name: "Qashqadaryo viloyati",
    nameRu: "Кашкадарьинская область",
    zone: 1,
    points: [
      { id: "qarshi-1", name: "Qarshi #1", address: "Qarshi shaxar" },
      { id: "shahrisabz-1", name: "Shahrisabz #1", address: "Shahrisabz shahri" },
      { id: "kitob-1", name: "Kitob #1", address: "Kitob tuman" },
      { id: "guzor-1", name: "G'uzor #1", address: "G'uzor tumani" },
      { id: "muborak-1", name: "Muborak #1", address: "Muborak tumani" },
    ],
  },
  {
    id: "surkhandarya",
    name: "Surxondaryo viloyati",
    nameRu: "Сурхандарьинская область",
    zone: 2,
    points: [
      { id: "termiz-1", name: "Termiz #1", address: "Termiz shahri" },
      { id: "denov-1", name: "Denov #1", address: "Denov tuman" },
      { id: "boysun-1", name: "Boysun #1", address: "Boysun tumani" },
      { id: "sherobod-1", name: "Sherobod #1", address: "Sherobod tumani" },
    ],
  },
  {
    id: "navoi",
    name: "Navoiy viloyati",
    nameRu: "Навоийская область",
    zone: 1,
    points: [
      { id: "navoi-city-1", name: "Navoiy #1", address: "Navoiy shaxar" },
      { id: "zarafshon-1", name: "Zarafshon #1", address: "Zarafshon shahri" },
      { id: "nurota-1", name: "Nurota #1", address: "Nurota tumani" },
      { id: "karmana-1", name: "Karmana #1", address: "Karmana tuman" },
    ],
  },
  {
    id: "jizzakh",
    name: "Jizzax viloyati",
    nameRu: "Джизакская область",
    zone: 1,
    points: [
      { id: "jizzakh-city-1", name: "Jizzax #1", address: "Jizzax shaxar" },
      { id: "zomin-1", name: "Zomin #1", address: "Zomin tumani" },
      { id: "dustlik-1", name: "Do'stlik #1", address: "Do'stlik tumani" },
      { id: "paxtakor-1", name: "Paxtakor #1", address: "Paxtakor tumani" },
    ],
  },
  {
    id: "syrdarya",
    name: "Sirdaryo viloyati",
    nameRu: "Сырдарьинская область",
    zone: 2,
    points: [
      { id: "guliston-1", name: "Guliston #1", address: "Guliston shahri" },
      { id: "yangiyer-1", name: "Yangiyer #1", address: "Yangiyer tumani" },
      { id: "xovos-1", name: "Xovos #1", address: "Xovos tumani" },
      { id: "shirin-1", name: "Shirin #1", address: "Shirin tuman" },
    ],
  },
  {
    id: "khorezm",
    name: "Xorazm viloyati",
    nameRu: "Хорезмская область",
    zone: 2,
    points: [
      { id: "urganch-1", name: "Urganch #1", address: "Urganch shahar" },
      { id: "xiva-1", name: "Xiva #1", address: "Xiva shahar" },
      { id: "gurlan-1", name: "Gurlan #1", address: "Gurlan tumani" },
      { id: "xozorasp-1", name: "Xozorasp #1", address: "Xozorasp tumani" },
    ],
  },
  {
    id: "karakalpakstan",
    name: "Qoraqalpog'iston",
    nameRu: "Каракалпакстан",
    zone: 2,
    points: [
      { id: "nukus-1", name: "Nukus #1", address: "Nukus shahri" },
      { id: "qongirot-1", name: "Qo'ng'irot #1", address: "Qo'ng'irot tuman" },
      { id: "beruniy-1", name: "Beruniy #1", address: "Beruniy tumani" },
      { id: "tortko-1", name: "To'rtko'l #1", address: "To'rtko'l tuman" },
      { id: "xojayli-1", name: "Xo'jayli #1", address: "Xo'jayli tumani" },
    ],
  },
]

/**
 * Calculate BTS delivery cost (Office-to-Office from Bukhara)
 */
export const calculateBtsCost = (weightKg: number, regionId: string): number => {
  const region = BTS_REGIONS.find((r) => r.id === regionId)
  if (!region) return 0

  const roundedWeight = Math.ceil(Math.max(BTS_PRICING.minWeight, weightKg))
  
  let cost: number

  if (roundedWeight <= BTS_PRICING.expressMaxWeight) {
    const tiers = Object.keys(BTS_PRICING.expressRates).map(Number).sort((a, b) => a - b)
    const tier = tiers.find(t => t >= roundedWeight) || tiers[tiers.length - 1]
    cost = BTS_PRICING.expressRates[tier][region.zone]
  } else {
    const ratePerKg = BTS_PRICING.zoneRates[region.zone]
    cost = roundedWeight * ratePerKg
    
    if (roundedWeight > BTS_PRICING.heavyWeightThreshold) {
      cost *= BTS_PRICING.heavyWeightCoefficient
    }
  }

  const currentMonth = new Date().getMonth() + 1
  if (BTS_PRICING.winterMonths.includes(currentMonth)) {
    cost *= (1 + BTS_PRICING.winterFuelSurcharge)
  }

  return Math.round(cost)
}

/**
 * GET /store/bts - Returns all BTS regions with pickup points and pricing config
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  try {
    // Return regions in format suitable for frontend dropdown
    let regions: any[] = []
    
    const btsApi = new BtsApiService(logger)
    try {
       // Try to get dynamic branches
       regions = await btsApi.getBranches()
    } catch (e) {
       logger?.warn(`[store/bts] Failed to get dynamic branches, using static fallback: ${e}`)
       // Fallback to static list if API fails
        const { BTS_REGIONS } = await import('./route.js')
       regions = BTS_REGIONS.map((r) => ({
        id: r.id,
        name: r.name,
        nameRu: r.nameRu,
        zone: r.zone,
        points: r.points.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          city_id: 0 // Static fallback doesn't have accurate city_ids usually.
        })),
      }))
    }

    return res.json({
      regions,
      pricing: BTS_PRICING,
    })
  } catch (e: any) {
    logger?.error?.(`[store/bts] Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}

/**
 * POST /store/bts - Calculate delivery cost for given weight and region
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  try {
    const { weight_kg, region_id, receiver_city_id } = (req.body || {}) as { weight_kg?: number; region_id?: string; receiver_city_id?: number }

    logger.info(`[store/bts] POST request: weight_kg=${weight_kg}, region_id=${region_id}, receiver_city_id=${receiver_city_id}`)

    if (typeof weight_kg !== "number" || !region_id) {
      return res.status(400).json({ error: "weight_kg and region_id are required" })
    }

    if (weight_kg <= 0 || Number.isNaN(weight_kg)) {
      return res.status(400).json({ error: "weight_kg must be a valid number greater than 0" })
    }

    const btsApi = new BtsApiService(logger)
    const btsCityId = receiver_city_id || btsApi.mapRegionToCityId(region_id)

    let cost: number
    let source: "api" | "local_fallback" = "api"
    let api_error: string | null = null

    try {
      // 1. Try real API first
      // Read warehouse config from env (defaults to Bukhara)
      const senderCityId = parseInt(process.env.BTS_SENDER_CITY_ID || '40')
      const senderPointId = parseInt(process.env.BTS_SENDER_POINT_ID || '263')
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[store/bts] Using sender: City ${senderCityId}, Point ${senderPointId}`)
      }
      
      cost = await btsApi.calculate({
        senderCityId,
        senderPointId,
        receiverCityId: btsCityId,
        weight: weight_kg,
        senderDelivery: 0, // Sender brings to office
        receiverDelivery: 0, // Pick up from BTS point
      })
    } catch (e: any) {
      // 2. Fallback to local calculator
      logger.warn(`[store/bts] API calculation failed, falling back to local: ${e.message}`)
      BtsApiService.incrementFallbackUsage()
      cost = calculateBtsCost(weight_kg, region_id)
      source = "local_fallback"
      api_error = e.message
    }

    const region = BTS_REGIONS.find((r) => r.id === region_id)

    return res.json({
      cost,
      weight_kg,
      region_id,
      region_name: region?.nameRu,
      source,
      api_error,
      bts_city_id: btsCityId
    })
  } catch (e: any) {
    logger?.error?.(`[store/bts] POST Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}
