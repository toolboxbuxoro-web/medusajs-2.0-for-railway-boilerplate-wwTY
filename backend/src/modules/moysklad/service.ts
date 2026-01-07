import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
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

  /**
   * Get default headers for MoySklad API requests
   */
  private getHeaders(): HeadersInit {
    return {
      "Authorization": `Bearer ${this.token_}`,
      "Accept": "application/json;charset=utf-8",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json"
    }
  }

  /**
   * Retrieve stock for a single SKU (code)
   */
  async retrieveStockBySku(sku: string): Promise<number> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const url = `${this.baseUrl_}/entity/assortment?filter=code=${encodeURIComponent(sku)}`
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
      }

      const data: MoySkladAssortmentResponse = await response.json()
      
      if (data.rows && data.rows.length > 0) {
        const product = data.rows[0]
        return product.quantity || 0
      }

      this.logger_.warn(`Product with SKU ${sku} not found in MoySklad`)
      return 0
    } catch (error) {
      this.logger_.error(`Failed to retrieve stock for SKU ${sku} from MoySklad`, error)
      throw error
    }
  }

  /**
   * Retrieve all products with stock in bulk (with pagination)
   * Returns a Map of code => quantity for efficient lookup
   * Only includes stock from configured warehouses
   */
  async retrieveAllStock(): Promise<Map<string, number>> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const stockMap = new Map<string, number>()
    const batchSize = 1000
    let offset = 0
    let totalFetched = 0
    let totalProducts = 0

    this.logger_.info("Starting bulk stock retrieval from MoySklad...")
    this.logger_.info(`Filtering by ${WAREHOUSE_IDS.length} warehouses`)

    try {
      do {
        const url = `${this.baseUrl_}/report/stock/bystore?limit=${batchSize}&offset=${offset}`
        
        const response = await fetch(url, {
          headers: this.getHeaders()
        })

        if (!response.ok) {
          throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
        }

        const data: MoySkladStockByStoreResponse = await response.json()
        totalProducts = data.meta.size

        for (const product of data.rows) {
          if (product.code) {
            // Sum stock from selected warehouses only
            let totalStock = 0
            
            for (const storeStock of product.stockByStore) {
              // Extract store ID from meta.href
              const storeId = storeStock.meta.href.split('/').pop()
              
              if (storeId && WAREHOUSE_IDS.includes(storeId)) {
                totalStock += storeStock.stock || 0
              }
            }
            
            stockMap.set(product.code, totalStock)
          }
        }

        totalFetched += data.rows.length
        offset += batchSize

        this.logger_.info(`Fetched ${totalFetched}/${totalProducts} products from MoySklad...`)

        // Small delay to avoid rate limiting
        if (offset < totalProducts) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } while (offset < totalProducts)

      this.logger_.info(`Successfully retrieved stock for ${stockMap.size} products from MoySklad`)
      return stockMap

    } catch (error) {
      this.logger_.error("Failed to retrieve bulk stock from MoySklad", error)
      throw error
    }
  }

  /**
   * Get total count of products in MoySklad
   */
  async getProductCount(): Promise<number> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const url = `${this.baseUrl_}/entity/assortment?limit=1`
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
      }

      const data: MoySkladAssortmentResponse = await response.json()
      return data.meta.size

    } catch (error) {
      this.logger_.error("Failed to get product count from MoySklad", error)
      throw error
    }
  }

  /**
   * Retrieve all stores (warehouses)
   */
  async retrieveStores(): Promise<{ id: string; name: string }[]> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const url = `${this.baseUrl_}/entity/store`
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.rows.map((store: any) => ({
        id: store.id,
        name: store.name
      }))

    } catch (error) {
      this.logger_.error("Failed to retrieve stores from MoySklad", error)
      throw error
    }
  }
}
