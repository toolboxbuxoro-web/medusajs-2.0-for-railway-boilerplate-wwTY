import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: -32504,
        message: "Insufficient privileges to perform this operation."
      }
    })
  }

  const token = authHeader.split(" ")[1]
  const decoded = Buffer.from(token, "base64").toString("utf-8")
  const [username, password] = decoded.split(":")

  // Validate password (PAYME_KEY)
  const correctKey = process.env.PAYME_KEY
  if (!correctKey) {
    console.error("PAYME_KEY not set in environment variables")
    return res.status(500).json({ error: { code: -32400, message: "System error" } })
  }

  if (password !== correctKey) {
    return res.status(401).json({
      error: {
        code: -32504,
        message: "Insufficient privileges to perform this operation."
      }
    })
  }

  const { method, params, id } = req.body as any

  try {
    let result
    switch (method) {
      case "CheckPerformTransaction":
        result = await checkPerformTransaction(req, params)
        break
      case "CreateTransaction":
        result = await createTransaction(req, params)
        break
      case "PerformTransaction":
        result = await performTransaction(req, params)
        break
      case "CancelTransaction":
        result = await cancelTransaction(req, params)
        break
      case "CheckTransaction":
        result = await checkTransaction(req, params)
        break
      case "GetStatement":
        result = await getStatement(req, params)
        break
      default:
        return res.json({
          error: {
            code: -32601,
            message: "Method not found"
          },
          id
        })
    }

    return res.json({
      result,
      id
    })
  } catch (error: any) {
    return res.json({
      error: {
        code: error.code || -32400,
        message: error.message || "System error",
        data: error.data
      },
      id
    })
  }
}

async function checkPerformTransaction(req: MedusaRequest, params: any) {
  // Verify order exists and amount matches
  // params.amount is in tiyins (1/100 sum)
  // params.account.order_id should be our Cart ID or Order ID
  
  // const cartService = req.scope.resolve("cartService")
  // const cart = await cartService.retrieve(params.account.order_id)
  
  // if (!cart) throw { code: -31050, message: "Order not found" }
  // if (cart.total !== params.amount) throw { code: -31001, message: "Wrong amount" }

  return { allow: true }
}

async function createTransaction(req: MedusaRequest, params: any) {
  // Create transaction logic
  // Return transaction state
  return {
    create_time: Date.now(),
    transaction: "123",
    state: 1
  }
}

async function performTransaction(req: MedusaRequest, params: any) {
  // Mark payment as successful
  return {
    transaction: "123",
    perform_time: Date.now(),
    state: 2
  }
}

async function cancelTransaction(req: MedusaRequest, params: any) {
  // Cancel payment
  return {
    transaction: "123",
    cancel_time: Date.now(),
    state: -1
  }
}

async function checkTransaction(req: MedusaRequest, params: any) {
  // Check status
  return {
    create_time: Date.now(),
    perform_time: Date.now(),
    cancel_time: 0,
    transaction: "123",
    state: 2,
    reason: null
  }
}

async function getStatement(req: MedusaRequest, params: any) {
  return {
    transactions: []
  }
}
