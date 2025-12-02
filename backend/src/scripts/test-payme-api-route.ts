import { ExecArgs } from "@medusajs/framework/types"

export default async function testPaymeApiRoute({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const configModule = container.resolve("configModule")
  
  // We need to fetch the backend URL. Assuming localhost:9000 for local dev.
  const BACKEND_URL = "http://localhost:9000"
  const PAYME_KEY = process.env.PAYME_KEY
  
  if (!PAYME_KEY) {
    console.error("PAYME_KEY not found in env")
    return
  }

  console.log("--- Testing Payme API Route ---")

  // 1. Get a valid order/cart ID
  const remoteQuery = container.resolve("remoteQuery")
  const carts = await remoteQuery({
    entryPoint: "cart",
    fields: ["id", "total"],
    variables: { take: 1 }
  })

  if (!carts.length) {
    console.log("No carts found. Please create a cart first.")
    return
  }
  const cart = carts[0]
  console.log(`Using Cart ID: ${cart.id}, Total: ${cart.total}`)

  // Helper to make requests
  const callPayme = async (method: string, params: any) => {
    const auth = Buffer.from(`Paycom:${PAYME_KEY}`).toString('base64')
    
    try {
      const response = await fetch(`${BACKEND_URL}/payme`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          method,
          params,
          id: Date.now()
        })
      })
      
      const data = await response.json()
      console.log(`\n[${method}] Response status:`, response.status)
      console.log(`[${method}] Response body:`, JSON.stringify(data, null, 2))
      return data
    } catch (e) {
      console.error(`[${method}] Error:`, e)
    }
  }

  // 2. Test CheckPerformTransaction
  await callPayme("CheckPerformTransaction", {
    amount: cart.total,
    account: {
      order_id: cart.id
    }
  })

  // 3. Test CreateTransaction
  await callPayme("CreateTransaction", {
    id: "trans_api_" + Date.now(),
    time: Date.now(),
    amount: cart.total,
    account: {
      order_id: cart.id
    }
  })
}
