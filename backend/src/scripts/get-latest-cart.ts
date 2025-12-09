import { ExecArgs } from "@medusajs/framework/types"

export default async function getLatestCart({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")

  console.log("Fetching latest carts...")

  const query = await remoteQuery({
    entryPoint: "cart",
    fields: ["id", "created_at", "total", "currency_code"],
    variables: {
      take: 5,
      skip: 0,
      order: { created_at: "DESC" } 
    }
  })

  // Since remoteQuery might not respect 'order' variable directly depending on graph config,
  // let's manually sort if needed, but 'take' usually works.
  // Actually, for remoteQuery entry point, variables are passed to the service.
  
  console.log("Query Result Type:", typeof query)
  // console.log("Query Result:", JSON.stringify(query, null, 2))

  let carts: any[] = []
  if (Array.isArray(query)) {
    carts = query
  } else if (query && typeof query === 'object' && 'rows' in query && Array.isArray((query as any).rows)) {
    carts = (query as any).rows
  } else if (query && typeof query === 'object' && 'data' in query && Array.isArray((query as any).data)) {
      carts = (query as any).data
  } else {
      // It might be a single object if valid, but usually we expect list
      if (query) carts = [query]
  }

  if (carts.length === 0) {
    console.log("No carts found in the database. Please go to the storefront and create a cart.")
    return
  }
  
  console.log("Found carts:")
  carts.forEach(c => {
      console.log(`ID: ${c.id} | Amount: ${c.total} | Status: ${c.completed_at ? "COMPLETED" : "OPEN"}`)
  })
  
  // Find first OPEN cart
  const openCart = carts.find(c => !c.completed_at)
  
  if (openCart) {
      console.log("\n✅ LATEST OPEN CART ID FOR PAYME TESTER:")
      console.log(openCart.id)
      console.log(`Amount: ${openCart.total}`)
  } else {
      console.log("\n❌ NO OPEN CARTS FOUND. PLEASE CREATE A NEW CART IN STOREFRONT.")
  }
}
