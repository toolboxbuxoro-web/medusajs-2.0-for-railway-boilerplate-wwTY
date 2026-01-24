/**
 * BTS Express Uzbekistan - Official Tariff Card 2025
 * Source: bts.uz/documenty/ru/xizmatlarining-tarif-karta/2025-01-10
 * 
 * PRICING STRUCTURE (Office-to-Office from Bukhara):
 * 
 * 1. LTL Cargo (21+ kg): Zone-based per-kg pricing
 *    - Zone 1: 5,000 UZS/kg (nearby: Samarkand, Jizzakh)
 *    - Zone 2: 6,000 UZS/kg (medium: Tashkent, Surkhandarya, Khorezm)
 *    - Zone 3: 6,500 UZS/kg (far: Fergana Valley)
 * 
 * 2. Express Mail (<20 kg): Fixed rates per weight tier
 *    - Uses EXPRESS_RATES table below
 * 
 * ADDITIONAL FEES:
 * - Courier pickup: +30,000 UZS
 * - Courier delivery: +30,000 UZS
 * - Heavy cargo (>50kg): ×1.3
 * - Winter fuel (Dec-Mar): +30%
 * - Insurance: 0.5% of declared value
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
  // Zone-based pricing for LTL cargo (21+ kg) per 1 kg
  zoneRates: {
    1: 5000,  // Zone 1: Samarkand, Jizzakh, Navoi
    2: 6000,  // Zone 2: Tashkent, Surkhandarya, Khorezm, Karakalpakstan
    3: 6500,  // Zone 3: Fergana, Namangan, Andijan
  } as Record<1 | 2 | 3, number>,
  
  // Express Mail fixed rates for parcels <20kg (Bukhara origin)
  // Format: weight in kg -> price in UZS per zone
  expressRates: {
    1: { 1: 28000, 2: 33000, 3: 38000 },
    2: { 1: 33000, 2: 38000, 3: 43000 },
    3: { 1: 38000, 2: 43000, 3: 48000 },
    5: { 1: 48000, 2: 58000, 3: 63000 },
    10: { 1: 75000, 2: 96000, 3: 105000 },
    15: { 1: 105000, 2: 129000, 3: 145000 },
    20: { 1: 130000, 2: 160000, 3: 180000 },
  } as Record<number, Record<1 | 2 | 3, number>>,
  
  // Weight thresholds
  expressMaxWeight: 20,  // Up to 20kg uses fixed Express rates
  minWeight: 1,
  
  // Additional fees
  courierPickupFee: 30000,
  courierDeliveryFee: 30000,
  
  // Heavy weight surcharge (>50kg): x1.3
  heavyWeightThreshold: 50,
  heavyWeightCoefficient: 1.3,
  
  // Winter fuel surcharge (December-March): +30%
  winterMonths: [12, 1, 2, 3],
  winterFuelSurcharge: 0.30,
  
  // Insurance rate
  insuranceRate: 0.005, // 0.5% of declared value
}

// All BTS regions with pickup points
export const BTS_REGIONS: BtsRegion[] = [
  // ========================
  // TASHKENT CITY
  // ========================
  {
    id: "tashkent-city",
    name: "Toshkent shahri",
    nameRu: "Ташкент",
    zone: 2,
    points: [
      // Yakkasaroy
      { id: "yakkasaroy-1", name: "Yakkasaroy #1", address: "Yakkasaroy tumani", coordinates: { lat: 41.291369, lng: 69.250614 } },
      { id: "yakkasaroy-2", name: "Yakkasaroy #2", address: "Yakkasaroy tumani", coordinates: { lat: 41.265182, lng: 69.242010 } },
      { id: "yakkasaroy-3", name: "Yakkasaroy #3", address: "Yakkasaroy tumani", coordinates: { lat: 41.267659, lng: 69.233600 } },
      // Uchtepa
      { id: "uchtepa-1", name: "Uchtepa #1", address: "Uchtepa tumani", coordinates: { lat: 41.2816681, lng: 69.1799632 } },
      { id: "uchtepa-2", name: "Uchtepa #2", address: "Uchtepa tumani", coordinates: { lat: 41.286830, lng: 69.152615 } },
      // Chilonzor
      { id: "chilonzor-1", name: "Chilonzor #1", address: "Chilonzor tumani", coordinates: { lat: 41.298328, lng: 69.208142 } },
      { id: "chilonzor-2", name: "Chilonzor #2", address: "Chilonzor tumani", coordinates: { lat: 41.248006, lng: 69.165630 } },
      { id: "chilonzor-3", name: "Chilonzor #3", address: "Chilonzor tumani", coordinates: { lat: 41.243662, lng: 69.162991 } },
      // Yunusobod
      { id: "yunusobod-1", name: "Yunusobod #1", address: "Yunusobod tumani" },
      { id: "yunusobod-2", name: "Yunusobod #2", address: "Yunusobod tumani" },
      // Sergeli
      { id: "sergeli-1", name: "Sergeli #1", address: "Sergeli tumani" },
      // Mirobod
      { id: "mirobod-1", name: "Mirobod #1", address: "Mirobod tumani" },
      // Olmazor
      { id: "olmazor-1", name: "Olmazor #1", address: "Olmazor tumani" },
      // Shayxontohur
      { id: "shayxontohur-1", name: "Shayxontohur #1", address: "Shayxontohur tumani", coordinates: { lat: 41.319124, lng: 69.240262 } },
      // M.Ulugbek
      { id: "ulugbek-1", name: "M.Ulug'bek #1", address: "M.Ulug'bek tumani" },
      // Yashnobod
      { id: "yashnobod-1", name: "Yashnobod #1", address: "Yashnobod tumani" },
      // Yangihayot
      { id: "yangihayot-1", name: "Yangihayot #1", address: "Yangihayot tumani", coordinates: { lat: 41.198740, lng: 69.239434 } },
    ],
  },
  // ========================
  // TASHKENT REGION
  // ========================
  {
    id: "tashkent-region",
    name: "Toshkent viloyati",
    nameRu: "Ташкентская область",
    zone: 2,
    points: [
      { id: "chirchiq-1", name: "Chirchiq #1", address: "Chirchiq shahri", coordinates: { lat: 41.474813, lng: 69.588587 } },
      { id: "chirchiq-2", name: "Chirchiq #2", address: "Chirchiq shahri", coordinates: { lat: 41.437656, lng: 69.544890 } },
      { id: "olmaliq-1", name: "Olmaliq #1", address: "Olmaliq shahri", coordinates: { lat: 40.852972, lng: 69.599335 } },
      { id: "angren-1", name: "Angren #1", address: "Angren shahri", coordinates: { lat: 41.011137, lng: 70.086103 } },
      { id: "oqqorgon-1", name: "Oqqo'rg'on #1", address: "Oqqo'rg'on tuman", coordinates: { lat: 40.880317, lng: 69.047208 } },
      { id: "yangiyol-1", name: "Yangiyo'l #1", address: "Yangiyo'l shahar", coordinates: { lat: 41.118387, lng: 69.059300 } },
      { id: "bekobod-1", name: "Bekobod #1", address: "Bekobod shahri", coordinates: { lat: 40.213693, lng: 69.265052 } },
      { id: "nurafshon-1", name: "Nurafshon #1", address: "Nurafshon shahri" },
      { id: "qibray-1", name: "Qibray #1", address: "Qibray tumani" },
      { id: "parkent-1", name: "Parkent #1", address: "Parkent tuman" },
      { id: "gazalkent-1", name: "G'azalkent #1", address: "G'azalkent shahri" },
    ],
  },
  // ========================
  // SAMARKAND REGION
  // ========================
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
  // ========================
  // BUKHARA REGION
  // ========================
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
  // ========================
  // FERGANA REGION
  // ========================
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
  // ========================
  // NAMANGAN REGION
  // ========================
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
  // ========================
  // ANDIJAN REGION
  // ========================
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
  // ========================
  // KASHKADARYA REGION
  // ========================
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
  // ========================
  // SURKHANDARYA REGION
  // ========================
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
  // ========================
  // NAVOI REGION
  // ========================
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
  // ========================
  // JIZZAKH REGION
  // ========================
  {
    id: "jizzakh",
    name: "Jizzax viloyati",
    nameRu: "Джизакская область",
    zone: 1, // Changed from 3 (Jizzakh is near Samarkand/Bukhara)
    points: [
      { id: "jizzakh-city-1", name: "Jizzax #1", address: "Jizzax shaxar" },
      { id: "zomin-1", name: "Zomin #1", address: "Zomin tumani" },
      { id: "dustlik-1", name: "Do'stlik #1", address: "Do'stlik tumani" },
      { id: "paxtakor-1", name: "Paxtakor #1", address: "Paxtakor tumani" },
    ],
  },
  // ========================
  // SYRDARYA REGION
  // ========================
  {
    id: "syrdarya",
    name: "Sirdaryo viloyati",
    nameRu: "Сырдарьинская область",
    zone: 2, // Changed from 3 (Syrdarya is between Samarkand and Tashkent)
    points: [
      { id: "guliston-1", name: "Guliston #1", address: "Guliston shahri" },
      { id: "yangiyer-1", name: "Yangiyer #1", address: "Yangiyer tumani" },
      { id: "xovos-1", name: "Xovos #1", address: "Xovos tumani" },
      { id: "shirin-1", name: "Shirin #1", address: "Shirin tuman" },
    ],
  },
  // ========================
  // KHOREZM REGION
  // ========================
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
  // ========================
  // KARAKALPAKSTAN
  // ========================
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
 * 
 * Uses official 2025 Tariff Card pricing:
 * - Express Mail (<20kg): Fixed rates per weight tier
 * - LTL Cargo (21+kg): Zone-based per-kg pricing
 * - Heavy weight (>50kg): ×1.3
 * - Winter (Dec-Mar): +30% fuel surcharge
 * 
 * @param weightKg - Total weight in kilograms
 * @param regionId - Region ID from BTS_REGIONS
 * @returns Delivery cost in UZS
 */
export const calculateBtsCost = async (weightKg: number, regionId: string, receiverCityId?: number): Promise<number> => {
  try {
    const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const response = await fetch(`${backendUrl}/store/bts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({
        weight_kg: weightKg,
        region_id: regionId,
        receiver_city_id: receiverCityId,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.cost
    }
    
    console.warn("[BTS] Backend API failed, using local fallback")
  } catch (err) {
    console.error("[BTS] Failed to fetch cost from API, using local fallback:", err)
  }

  // Local fallback logic
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
 * Fetch dynamic list of regions and points from backend
 * Falls back to static BTS_REGIONS if request fails
 */
export const fetchBtsRegions = async (): Promise<BtsRegion[]> => {
  try {
    const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    
    // 5 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${backendUrl}/store/bts/cities`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data.cities) && data.cities.length > 0) {
        return data.cities
      }
    }
    
    console.warn("[BTS] Failed to fetch dynamic regions, using static fallback")
  } catch (err) {
    console.error("[BTS] Error fetching regions:", err)
  }

  return BTS_REGIONS
}

/**
 * Get all regions for dropdown (Static)
 * @deprecated Use fetchBtsRegions() instead for dynamic data
 */
export const getBtsRegions = () => {
  return BTS_REGIONS.map((r) => ({
    id: r.id,
    name: r.name,
    nameRu: r.nameRu,
  }))
}

/**
 * Get points for a specific region
 */
export const getBtsPointsByRegion = (regionId: string) => {
  const region = BTS_REGIONS.find((r) => r.id === regionId)
  return region?.points || []
}

// Legacy exports for backwards compatibility
export const BTS_DATA = BTS_REGIONS
