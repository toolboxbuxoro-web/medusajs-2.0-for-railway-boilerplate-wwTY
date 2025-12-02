import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PaymeMerchantService, PaymeError } from "../../modules/payment-payme/services/payme-merchant"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger")
  const paymeMerchantService = new PaymeMerchantService({ 
    logger, 
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

    const [username, password] = Buffer.from(credentials, "base64").toString().split(":")
    
    // Payme sends "Paycom" as username and the Key as password
    // We check against PAYME_KEY from env
    if (password !== process.env.PAYME_KEY) {
      logger.warn(`Payme Auth Failed: Invalid key provided. Received: ${password?.substring(0, 5)}...`)
      throw new PaymeError(-32504, "Insufficient privilege")
    }

    // 2. Parse JSON-RPC
    const { method,params, id } = req.body as any
    
    logger.info(`Payme Request: ${method} - ${JSON.stringify(params)}`)

    // 3. Handle Request
    const result = await paymeMerchantService.handleRequest(method, params)

    // 4. Send Response
    res.json({
      result,
      id,
      error: null
    })

  } catch (error) {
    logger.error("Payme Error", error)
    
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
          message: "System error",
          data: error.message
        },
        result: null,
        id
      })
    }
  }
}
