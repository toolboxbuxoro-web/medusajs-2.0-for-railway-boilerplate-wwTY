import dotenv from "dotenv"
import path from "path"

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const PAYME_URL = "http://localhost:9000/payme"
const PAYME_ID = process.env.PAYME_ID
const PAYME_KEY = process.env.PAYME_KEY

if (!PAYME_ID || !PAYME_KEY) {
  console.error("PAYME_ID or PAYME_KEY not found in .env")
  process.exit(1)
}

const auth = Buffer.from(`Paycom:${PAYME_KEY}`).toString("base64")
const headers = {
  Authorization: `Basic ${auth}`,
  "Content-Type": "application/json",
}

async function sendRequest(method: string, params: any) {
  try {
    const response = await fetch(PAYME_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        method,
        params,
        id: 123,
      }),
    })
    
    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("Request failed:", error.message)
    return null
  }
}

async function runTests() {
  console.log("Starting Payme Verification...")
  console.log(`URL: ${PAYME_URL}`)
  console.log(`ID: ${PAYME_ID}`)

  const orderId = "order_test_" + Date.now()
  const amount = 500000 // 5000.00 UZS
  const transactionId = "tx_" + Date.now()

  // 1. CheckPerformTransaction
  console.log("\n1. Testing CheckPerformTransaction...")
  const checkRes = await sendRequest("CheckPerformTransaction", {
    amount,
    account: { order_id: orderId },
  })
  console.log("Result:", JSON.stringify(checkRes, null, 2))
  if (checkRes?.result?.allow) console.log("✅ CheckPerformTransaction Passed")
  else console.error("❌ CheckPerformTransaction Failed")

  // 2. CreateTransaction
  console.log("\n2. Testing CreateTransaction...")
  const createRes = await sendRequest("CreateTransaction", {
    id: transactionId,
    time: Date.now(),
    amount,
    account: { order_id: orderId },
  })
  console.log("Result:", JSON.stringify(createRes, null, 2))
  if (createRes?.result?.state === 1) console.log("✅ CreateTransaction Passed")
  else console.error("❌ CreateTransaction Failed")

  // 3. CheckTransaction (State 1)
  console.log("\n3. Testing CheckTransaction (Created)...")
  const checkTxRes1 = await sendRequest("CheckTransaction", {
    id: transactionId,
  })
  console.log("Result:", JSON.stringify(checkTxRes1, null, 2))
  if (checkTxRes1?.result?.state === 1) console.log("✅ CheckTransaction (State 1) Passed")
  else console.error("❌ CheckTransaction (State 1) Failed")

  // 4. PerformTransaction
  console.log("\n4. Testing PerformTransaction...")
  const performRes = await sendRequest("PerformTransaction", {
    id: transactionId,
  })
  console.log("Result:", JSON.stringify(performRes, null, 2))
  if (performRes?.result?.state === 2) console.log("✅ PerformTransaction Passed")
  else console.error("❌ PerformTransaction Failed")

  // 5. CheckTransaction (State 2)
  console.log("\n5. Testing CheckTransaction (Completed)...")
  const checkTxRes2 = await sendRequest("CheckTransaction", {
    id: transactionId,
  })
  console.log("Result:", JSON.stringify(checkTxRes2, null, 2))
  if (checkTxRes2?.result?.state === 2) console.log("✅ CheckTransaction (State 2) Passed")
  else console.error("❌ CheckTransaction (State 2) Failed")

  // 6. CancelTransaction (After complete)
  console.log("\n6. Testing CancelTransaction (After Complete)...")
  const cancelRes = await sendRequest("CancelTransaction", {
    id: transactionId,
    reason: 1,
  })
  console.log("Result:", JSON.stringify(cancelRes, null, 2))
  if (cancelRes?.result?.state === -2) console.log("✅ CancelTransaction Passed")
  else console.error("❌ CancelTransaction Failed")
  
  // 7. GetStatement
  console.log("\n7. Testing GetStatement...")
  const statementRes = await sendRequest("GetStatement", {
    from: Date.now() - 3600000,
    to: Date.now() + 3600000
  })
  console.log("Result:", JSON.stringify(statementRes, null, 2))
  if (statementRes?.result?.transactions?.length > 0) console.log("✅ GetStatement Passed")
  else console.error("❌ GetStatement Failed (No transactions found, but might be expected if time range is strict)")

}

runTests()
