import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

interface MoySkladPriceType {
  id: string
  name: string
  externalCode?: string
}

interface MoySkladSalePrice {
  value: number  // Price in smallest currency units (e.g., tiyin for UZS)
  currency: {
    meta: { href: string }
    name: string
  }
  priceType: {
    meta: { href: string; type: string }
    id: string
    name: string
  }
}

interface MoySkladProduct {
  id: string
  name: string
  code: string
  article?: string
  quantity: number
  stock: number
  reserve: number
  inTransit: number
  salePrices?: MoySkladSalePrice[]
}

interface MoySkladAssortmentResponse {
  meta: {
    size: number
    limit: number
    offset: number
  }
  rows: MoySkladProduct[]
}

interface MoySkladStockByStore {
  meta: {
    href: string
    type: string
    mediaType: string
  }
  code: string
  article?: string
  name: string
  // NOTE: salePrices is NOT included in /report/stock/bystore response!
  // For prices, use /entity/assortment with expand=salePrices
  stockByStore: Array<{
    meta: {
      href: string
      type: string
      mediaType: string
    }
    name: string
    stock: number
    reserve: number
    inTransit: number
  }>
}

interface MoySkladStockByStoreResponse {
  meta: {
    size: number
    limit: number
    offset: number
  }
  rows: MoySkladStockByStore[]
}

// Warehouse IDs to sync stock from
const WAREHOUSE_IDS = [
  'b58e534f-b91d-11ee-0a80-0107003c27c9', // Склад Toolbox 4
  '742f8e44-ed82-11ed-0a80-00cb009f538f', // Toolbox 1 Рай.Маг
  '5b25bcb2-d1d8-11ed-0a80-0e1e0028a95d', // Toolbox 2 Дон Бозори
  '815df250-bce8-11ee-0a80-0f0b001b27f6', // Toolbox 4 Бетонка
]

export default class MoySkladService {
  protected logger_: Logger
  protected token_: string
  protected baseUrl_ = "https://api.moysklad.ru/api/remap/1.2"

  constructor({ logger }: InjectedDependencies) {
    this.logger_ = logger
    this.token_ = process.env.MOYSKLAD_TOKEN || ""
    
    if (!this.token_) {
      this.logger_.warn("MOYSKLAD_TOKEN is not set in environment variables. MoySklad integration will not work.")
    }
  }

  private getHeaders() {
    return {
      "Authorization": `Bearer ${this.token_}`,
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json"
    }
  }

  /**
   * Get stock quantity for a specific SKU across configured warehouses
   */
  async retrieveStockBySku(sku: string): Promise<number> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    try {
      // Fetch assortment item by SKU
      const url = `${this.baseUrl_}/entity/assortment?filter=code=${encodeURIComponent(sku)}`
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.rows || data.rows.length === 0) {
        return 0
      }

      const product = data.rows[0]
      return product.stock || 0

    } catch (error) {
      this.logger_.error(`Failed to retrieve stock for SKU ${sku}`, error)
      throw error
    }
  }

  /**
   * Retrieve all products with stock in bulk
   * Returns a Map of SKU => total quantity across all warehouses
   */
  async retrieveAllStock(): Promise<Map<string, number>> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const stockMap = new Map<string, number>()
    
    this.logger_.info("Starting bulk stock retrieval from MoySklad...")

    try {
      const batchSize = 1000
      let offset = 0
      let totalProducts = 0
      let totalFetched = 0

      do {
        const url = `${this.baseUrl_}/report/stock/bystore?limit=${batchSize}&offset=${offset}`
        
        const response = await fetch(url, {
          headers: this.getHeaders()
        })

        if (!response.ok) {
          throw new Error(`MoySklad API error: ${response.status}`)
        }

        const data: MoySkladStockByStoreResponse = await response.json()
        totalProducts = data.meta.size

        for (const product of data.rows) {
          if (!product.code) continue

          let totalStock = 0
          if (product.stockByStore && Array.isArray(product.stockByStore)) {
            for (const store of product.stockByStore) {
              totalStock += store.stock || 0
            }
          }

          stockMap.set(product.code, totalStock)
        }

        totalFetched += data.rows.length
        offset += batchSize

        // Small delay to avoid rate limiting
        if (offset < totalProducts) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } while (offset < totalProducts)

      this.logger_.info(`Successfully retrieved stock for ${stockMap.size} products from MoySklad`)
      return stockMap

    } catch (error) {
      this.logger_.error("Failed to retrieve stock from MoySklad", error)
      throw error
    }
  }

  /**
   * Get total product count from MoySklad
   */
  async getProductCount(): Promise<number> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    try {
      const url = `${this.baseUrl_}/entity/assortment?limit=1`
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status}`)
      }

      const data = await response.json()
      return data.meta.size || 0

    } catch (error) {
      this.logger_.error("Failed to get product count from MoySklad", error)
      throw error
    }
  }

  /**
   * List all stores/warehouses
   */
  async listStores(): Promise<any[]> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    try {
      const url = `${this.baseUrl_}/entity/store`
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status}`)
      }

      const data = await response.json()
      return data.rows || []

    } catch (error) {
      this.logger_.error("Failed to list stores from MoySklad", error)
      throw error
    }
  }

  /**
   * Retrieve all price types from MoySklad
   * Useful for discovering available price type names
   */
  async retrievePriceTypes(): Promise<MoySkladPriceType[]> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    try {
      const url = `${this.baseUrl_}/context/companysettings/pricetype`
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status}`)
      }

      const data = await response.json()
      return data || []

    } catch (error) {
      this.logger_.error("Failed to retrieve price types from MoySklad", error)
      throw error
    }
  }

  /**
   * Retrieve all products with prices in bulk
   * Returns a Map of SKU => retail price (in main currency units, e.g., UZS)
   * 
   * IMPORTANT: Uses /entity/assortment endpoint with expand=salePrices
   * The /report/stock/bystore endpoint does NOT return salePrices!
   */
  async retrieveAllRetailPrices(retailPriceTypeName: string = "Розничная цена"): Promise<Map<string, number>> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const priceMap = new Map<string, number>()
    
    this.logger_.info("Starting bulk retail price retrieval from MoySklad...")
    this.logger_.info(`Looking for price type: "${retailPriceTypeName}"`)

    try {
      // Use /entity/assortment which includes products and variants
      // with salePrices when expanded
      const batchSize = 1000
      let offset = 0
      let totalProducts = 0
      let totalFetched = 0
      let pricesFound = 0
      let skippedNoCode = 0
      let skippedNoPrices = 0
      let skippedWrongPriceType = 0

      do {
        // CRITICAL: Must use expand=salePrices to get price data
        const url = `${this.baseUrl_}/entity/assortment?limit=${batchSize}&offset=${offset}&expand=salePrices`
        
        const response = await fetch(url, {
          headers: this.getHeaders()
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`MoySklad API error: ${response.status} ${response.statusText}. Body: ${errorText}`)
        }

        const data: MoySkladAssortmentResponse = await response.json()
        
        // Safety check
        if (!data || !data.meta) {
          throw new Error("Invalid response from MoySklad API: missing meta")
        }
        
        if (!data.rows || !Array.isArray(data.rows)) {
          throw new Error("Invalid response from MoySklad API: missing or invalid rows array")
        }

        totalProducts = data.meta.size

        for (const product of data.rows) {
          // Skip if no SKU/code
          if (!product.code) {
            skippedNoCode++
            continue
          }

          // Safety check for salePrices
          if (!product.salePrices || !Array.isArray(product.salePrices)) {
            skippedNoPrices++
            continue
          }

          // Find retail price with matching price type name
          const retailPrice = product.salePrices.find(
            price => price?.priceType?.name === retailPriceTypeName
          )

          if (!retailPrice) {
            skippedWrongPriceType++
            continue
          }

          // Validate price value
          if (typeof retailPrice.value !== 'number' || retailPrice.value < 0) {
            this.logger_.warn(`Invalid price value for SKU ${product.code}: ${retailPrice.value}`)
            continue
          }

          // Convert from smallest units to main units (e.g., tiyin to sum)
          // MoySklad stores prices in kopecks/tiyin (smallest units)
          const priceInMainUnits = retailPrice.value / 100
          priceMap.set(product.code, priceInMainUnits)
          pricesFound++
        }

        totalFetched += data.rows.length
        offset += batchSize

        // Log progress every 2000 items
        if (totalFetched % 2000 === 0 && totalFetched > 0) {
          this.logger_.info(`Progress: fetched ${totalFetched}/${totalProducts} products, found ${pricesFound} prices`)
        }

        // Small delay to avoid rate limiting
        if (offset < totalProducts) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } while (offset < totalProducts)

      // Final summary
      this.logger_.info(`Successfully retrieved ${pricesFound} retail prices from ${totalFetched} products`)
      this.logger_.info(`  Skipped: ${skippedNoCode} without code, ${skippedNoPrices} without salePrices, ${skippedWrongPriceType} without "${retailPriceTypeName}"`)
      
      if (pricesFound === 0) {
        this.logger_.warn(`⚠️ WARNING: No prices found! Check if price type "${retailPriceTypeName}" exists in MoySklad`)
      }
      
      return priceMap

    } catch (error) {
      this.logger_.error("Failed to retrieve retail prices from MoySklad:", error)
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`MoySklad price retrieval failed: ${error.message}`)
      }
      throw error
    }
  }
}
