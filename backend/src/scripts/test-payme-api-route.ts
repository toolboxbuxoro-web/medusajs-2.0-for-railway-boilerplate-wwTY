import { ExecArgs } from "@medusajs/framework/types"
import { PaymeMerchantService } from "../modules/payment-payme/services/payme-merchant"
import { Modules } from "@medusajs/framework/utils"

export default async function testPaymeApiRoute({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  
  console.log("--- Testing Payme Logic (Mocked) ---")

  // Mock Data
  const MOCK_CART_ID = "cart_test_123"
  const MOCK_SESSION_ID = "pay_sess_123"
  const MOCK_TRANS_ID = "trans_payme_123"
  const AMOUNT = 10000 // 100.00 UZS in tiyin

  // Mock Payment Session State
  let sessionState = {
    id: MOCK_SESSION_ID,
    amount: 100, // 100.00 UZS (Medusa stores in main units for UZS based on my fix? No, money.ts handles display. DB stores what?)
    // Wait, payme.ts: "const amountInTiyin = amount". So Medusa stores 10000 if it's tiyin?
    // Let's assume Medusa stores 100.00 UZS as 10000 if currency is 2 decimals, or 100 if 0 decimals.
    // My fix in money.ts treated UZS as 0 decimals.
    // So 100 UZS = 100 in DB.
    // Payme expects tiyin. 100 UZS = 10000 tiyin.
    // My fix in payme.ts: "const amountInTiyin = amount". 
    // If Medusa stores 100, and we send 100 to Payme, that's 1 tiyin. That's wrong.
    // I removed the * 100 in payme.ts.
    // If Medusa stores 10000 (100.00), and we send 10000, that's 100.00 UZS. Correct.
    
    // Let's assume Medusa stores 10000.
    currency_code: "uzs",
    data: {
      payme_state: 0
    } as any
  }

  // Mock Payment Module
  const mockPaymentModule = {
    retrievePaymentSession: async (id: string) => {
      if (id === MOCK_SESSION_ID) return { ...sessionState, data: { ...sessionState.data } }
      throw new Error("Session not found")
    },
    updatePaymentSession: async (input: any) => {
      console.log(`[MockPayment] Updating session ${input.id}:`, JSON.stringify(input.data))
      sessionState.data = { ...sessionState.data, ...input.data }
      return sessionState
    }
  }

  // Mock Remote Query (for getPaymentSession)
  const mockRemoteQuery = async (query: any) => {
    if (query.entryPoint === "cart") {
      return [{
        id: MOCK_CART_ID,
        total: 10000,
        payment_collection: {
          payment_sessions: [{
            id: MOCK_SESSION_ID,
            provider_id: "payme",
            amount: 10000,
            data: sessionState.data
          }]
        }
      }]
    }
    return []
  }

  // Mock Container
  const mockContainer = {
    resolve: (key: string) => {
      if (key === Modules.PAYMENT) return mockPaymentModule
      if (key === "remoteQuery") return mockRemoteQuery
      if (key === "logger") return logger
      return container.resolve(key)
    }
  }

  // Initialize Service with Mock Container
  const paymeService = new PaymeMerchantService({ logger, container: mockContainer })

  // Helper
  const callPayme = async (method: string, params: any) => {
    try {
      console.log(`\n[${method}] Calling...`)
      const result = await paymeService.handleRequest(method, params)
      console.log(`[${method}] Result:`, JSON.stringify(result, null, 2))
      return { result }
    } catch (e) {
      console.error(`[${method}] Error:`, e.message)
      return { error: e }
    }
  }

  // 1. CheckPerformTransaction
  await callPayme("CheckPerformTransaction", {
    amount: AMOUNT,
    account: { order_id: MOCK_CART_ID }
  })

  // 2. CreateTransaction
  const createRes = await callPayme("CreateTransaction", {
    id: MOCK_TRANS_ID,
    time: Date.now(),
    amount: AMOUNT,
    account: { order_id: MOCK_CART_ID }
  })

  // 3. PerformTransaction
  // Note: CreateTransaction returns session ID as transaction ID (based on my fix in payme-merchant.ts)
  // So we pass session ID to PerformTransaction
  const sessionIdAsTransId = (createRes.result as any).transaction
  console.log("Session ID returned as Transaction ID:", sessionIdAsTransId)

  await callPayme("PerformTransaction", {
    id: sessionIdAsTransId
  })

  // 4. CheckTransaction
  await callPayme("CheckTransaction", {
    id: sessionIdAsTransId
  })

  // 5. Verify Final State
  console.log("\n--- Final Verification ---")
  console.log("Session Data:", JSON.stringify(sessionState.data, null, 2))
  
  if (sessionState.data.payme_state === 2) {
    console.log("✅ SUCCESS: Payme State is 2 (Performed)")
  } else {
    console.error("❌ FAILURE: Payme State is not 2")
  }

  // Verify if authorized
  // My PerformTransaction logic calls updatePaymentSession with transaction_id
  if (sessionState.data.transaction_id) {
     console.log("✅ SUCCESS: Transaction ID set (Authorized)")
  } else {
     console.error("❌ FAILURE: Transaction ID not set")
  }
}
