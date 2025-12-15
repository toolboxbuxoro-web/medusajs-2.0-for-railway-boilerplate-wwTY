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

    try {
      do {
        const url = `${this.baseUrl_}/entity/assortment?limit=${batchSize}&offset=${offset}`
        
        const response = await fetch(url, {
          headers: this.getHeaders()
        })

        if (!response.ok) {
          throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
        }

        const data: MoySkladAssortmentResponse = await response.json()
        totalProducts = data.meta.size

        for (const product of data.rows) {
          if (product.code) {
            stockMap.set(product.code, product.quantity || 0)
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
}
