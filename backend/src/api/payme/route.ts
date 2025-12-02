import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

// Payme Error Codes
const PAYME_ERROR = {
  INTERNAL_ERROR: -32400,
  INSUFFICIENT_PRIVILEGE: -32504,
  INVALID_JSON_RPC_OBJECT: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  INVALID_ACCOUNT: -31050,
  COULD_NOT_CANCEL: -31007,
  COULD_NOT_PERFORM: -31008,
}

// Transaction States
const STATE = {
  CREATED: 1,
  COMPLETED: 2,
  CANCELLED: -1,
  CANCELLED_AFTER_COMPLETE: -2,
}

// In-memory store for transactions (Replace with DB in production)
// Using a simple object for now as we don't have a dedicated Transaction model yet
// In a real app, this should be stored in the database (e.g., Payment or Order metadata)
const transactions: Record<string, any> = {}

export const AUTHENTICATE = false

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(200).json({
      error: {
        code: PAYME_ERROR.INSUFFICIENT_PRIVILEGE,
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
    return res.status(200).json({ error: { code: PAYME_ERROR.INTERNAL_ERROR, message: "System error" } })
  }

  if (password !== correctKey) {
    return res.status(200).json({
      error: {
        code: PAYME_ERROR.INSUFFICIENT_PRIVILEGE,
        message: "Insufficient privileges to perform this operation.",
        data: {
          expected: correctKey,
          received: password,
          decoded: decoded
        }
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
            code: PAYME_ERROR.METHOD_NOT_FOUND,
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
    console.error("Payme Error:", error)
    return res.json({
      error: {
        code: error.code || PAYME_ERROR.INTERNAL_ERROR,
        message: error.message || "System error",
        data: error.data
      },
      id
    })
  }
}

async function checkPerformTransaction(req: MedusaRequest, params: any) {
  const { amount, account } = params
  const orderId = account.order_id

  if (!orderId) {
    throw { code: PAYME_ERROR.INVALID_ACCOUNT, message: { ru: "Неверный ID заказа", uz: "Buyurtma ID noto'g'ri", en: "Invalid Order ID" } }
  }

  // In a real implementation, fetch the order/cart from Medusa
  // const cartService = req.scope.resolve("cartService")
  // const cart = await cartService.retrieve(orderId)
  
  // Mock validation for now
  // Check if order exists (simulate)
  // if (!cart) throw { code: PAYME_ERROR.INVALID_ACCOUNT, message: "Order not found" }
  
  // Check amount (Payme sends in tiyins)
  // if (cart.total !== amount) throw { code: PAYME_ERROR.INVALID_AMOUNT, message: "Incorrect amount" }

  // For testing purposes, we accept any amount > 0
  if (amount <= 0) {
    throw { code: PAYME_ERROR.INVALID_AMOUNT, message: { ru: "Неверная сумма", uz: "Noto'g'ri summa", en: "Invalid amount" } }
  }

  return { allow: true }
}

async function createTransaction(req: MedusaRequest, params: any) {
  const { id, time, amount, account } = params
  const orderId = account.order_id

  // 1. Check if transaction exists
  if (transactions[id]) {
    const tx = transactions[id]
    // Check idempotency
    if (tx.state !== STATE.CREATED) {
      throw { code: PAYME_ERROR.COULD_NOT_PERFORM, message: { ru: "Транзакция уже выполнена", uz: "Tranzaksiya bajarilgan", en: "Transaction already performed" } }
    }
    // Check for timeout (e.g. 10 mins)
    if (Date.now() - tx.create_time > 600000) {
       tx.state = STATE.CANCELLED
       tx.reason = 4 // Timeout
       throw { code: PAYME_ERROR.COULD_NOT_PERFORM, message: { ru: "Таймаут транзакции", uz: "Tranzaksiya vaqti tugadi", en: "Transaction timed out" } }
    }
    return {
      create_time: tx.create_time,
      transaction: tx.transaction,
      state: tx.state
    }
  }

  // 2. CheckPerformTransaction logic again
  await checkPerformTransaction(req, params)

  // 3. Create new transaction
  // In production, save to DB
  transactions[id] = {
    id: id,
    time: time,
    amount: amount,
    account: account,
    create_time: Date.now(),
    perform_time: 0,
    cancel_time: 0,
    state: STATE.CREATED,
    transaction: orderId, // Our internal ID (order_id)
    reason: null
  }

  return {
    create_time: transactions[id].create_time,
    transaction: transactions[id].transaction,
    state: STATE.CREATED
  }
}

async function performTransaction(req: MedusaRequest, params: any) {
  const { id } = params

  const tx = transactions[id]
  if (!tx) {
    throw { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: { ru: "Транзакция не найдена", uz: "Tranzaksiya topilmadi", en: "Transaction not found" } }
  }

  if (tx.state === STATE.CREATED) {
    // Check timeout
    if (Date.now() - tx.create_time > 600000) {
      tx.state = STATE.CANCELLED
      tx.reason = 4
      throw { code: PAYME_ERROR.COULD_NOT_PERFORM, message: { ru: "Таймаут транзакции", uz: "Tranzaksiya vaqti tugadi", en: "Transaction timed out" } }
    }

    // Mark as completed
    tx.state = STATE.COMPLETED
    tx.perform_time = Date.now()
    
    // Here you would capture payment in Medusa
    // const paymentService = req.scope.resolve("paymentService")
    // await paymentService.capture(tx.transaction)

    return {
      transaction: tx.transaction,
      perform_time: tx.perform_time,
      state: STATE.COMPLETED
    }
  }

  if (tx.state === STATE.COMPLETED) {
    return {
      transaction: tx.transaction,
      perform_time: tx.perform_time,
      state: STATE.COMPLETED
    }
  }

  throw { code: PAYME_ERROR.COULD_NOT_PERFORM, message: { ru: "Невозможно выполнить транзакцию", uz: "Tranzaksiyani bajarib bo'lmaydi", en: "Could not perform transaction" } }
}

async function cancelTransaction(req: MedusaRequest, params: any) {
  const { id, reason } = params

  const tx = transactions[id]
  if (!tx) {
    throw { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: { ru: "Транзакция не найдена", uz: "Tranzaksiya topilmadi", en: "Transaction not found" } }
  }

  if (tx.state === STATE.COMPLETED) {
    // Check if can be cancelled (e.g. funds available)
    // For now allow cancellation
    tx.state = STATE.CANCELLED_AFTER_COMPLETE
    tx.cancel_time = Date.now()
    tx.reason = reason
    
    // Refund in Medusa
    
    return {
      transaction: tx.transaction,
      cancel_time: tx.cancel_time,
      state: STATE.CANCELLED_AFTER_COMPLETE
    }
  }

  if (tx.state === STATE.CREATED) {
    tx.state = STATE.CANCELLED
    tx.cancel_time = Date.now()
    tx.reason = reason

    return {
      transaction: tx.transaction,
      cancel_time: tx.cancel_time,
      state: STATE.CANCELLED
    }
  }
  
  // Already cancelled
  return {
    transaction: tx.transaction,
    cancel_time: tx.cancel_time,
    state: tx.state
  }
}

async function checkTransaction(req: MedusaRequest, params: any) {
  const { id } = params
  const tx = transactions[id]

  if (!tx) {
    throw { code: PAYME_ERROR.TRANSACTION_NOT_FOUND, message: { ru: "Транзакция не найдена", uz: "Tranzaksiya topilmadi", en: "Transaction not found" } }
  }

  return {
    create_time: tx.create_time,
    perform_time: tx.perform_time,
    cancel_time: tx.cancel_time,
    transaction: tx.transaction,
    state: tx.state,
    reason: tx.reason
  }
}

async function getStatement(req: MedusaRequest, params: any) {
  const { from, to } = params
  
  // Filter transactions by time
  const txs = Object.values(transactions).filter(t => t.create_time >= from && t.create_time <= to)
  
  return {
    transactions: txs.map(t => ({
      id: t.id,
      time: t.time,
      amount: t.amount,
      account: t.account,
      create_time: t.create_time,
      perform_time: t.perform_time,
      cancel_time: t.cancel_time,
      transaction: t.transaction,
      state: t.state,
      reason: t.reason
    }))
  }
}
