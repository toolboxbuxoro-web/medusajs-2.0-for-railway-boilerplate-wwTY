import { Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

export default class MoySkladService {
  protected logger_: Logger
  protected token_: string

  constructor({ logger }: InjectedDependencies) {
    this.logger_ = logger
    this.token_ = process.env.MOYSKLAD_TOKEN || ""
    
    if (!this.token_) {
      this.logger_.warn("MOYSKLAD_TOKEN is not set in environment variables. MoySklad integration will not work.")
    }
  }

  async retrieveStockBySku(sku: string): Promise<number> {
    if (!this.token_) {
      throw new Error("MOYSKLAD_TOKEN is not configured")
    }

    const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=code=${sku}`
    
    try {
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.token_}`,
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip"
        }
      })

      if (!response.ok) {
        throw new Error(`MoySklad API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // MoySklad returns an object with "rows" array. 
      // We assume the first match is the correct product if code is unique.
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
}
