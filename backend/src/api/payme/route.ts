import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PaymeMerchantService, PaymeError } from "../../modules/payment-payme/services/payme-merchant"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const paymeMerchantService = new PaymeMerchantService({ 
    logger: req.scope.resolve("logger"), 
    container: req.scope 
  })

  try {
    // 1. Basic Auth Validation
    const authHeader = req.headers.authorization
    if (!authHeader) {
      throw new PaymeError(-32504, "Insufficient privilege")
    }

    const [type, credentials] = authHeader.split(" ")
    if (type !== "Basic" || !credentials) {
      throw new PaymeError(-32504, "Insufficient privilege")
    }

    const [, password] = Buffer.from(credentials, "base64").toString().split(":")
    
    // Проверка ключа Payme
    if (password?.trim() !== process.env.PAYME_KEY?.trim()) {
      throw new PaymeError(-32504, "Insufficient privilege")
    }

    // Обработка JSON-RPC запроса
    const { method, params, id } = req.body as any
    const result = await paymeMerchantService.handleRequest(method, params)
    res.json({
      result,
      id,
      error: null
    })

  } catch (error) {
    const id = (req.body as any)?.id || null
    
    if (error instanceof PaymeError) {
      res.json({
        error: {
          code: error.code,
          message: error.message,
          data: error.data
        },
        result: null,
        id
      })
    } else {
      res.json({
        error: {
          code: -32400,
          message: "System error: " + error.message,
          data: error.message
        },
        result: null,
        id
      })
    }
  }
}
