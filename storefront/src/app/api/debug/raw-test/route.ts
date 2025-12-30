import { sdk } from "@lib/config"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const regionId = "reg_01KAY0QXWMQSDRYZRGRCKE0GAN"
  const collectionId = "pcol_01KDPNYNG9KKBM7VK9661VQNJA" // Хиты продаж

  try {
    // Test 1: Full query with array collection_id (What we currently use)
    const res1 = await sdk.store.product.list({
      region_id: regionId,
      collection_id: [collectionId],
    })

    // Test 2: Full query with string collection_id
    const res2 = await sdk.store.product.list({
      region_id: regionId,
      // @ts-ignore
      collection_id: collectionId,
    })

    // Test 3: Bare minimum (just collection)
    const res3 = await sdk.store.product.list({
      collection_id: [collectionId],
    })

    // Test 4: Just region
    const res4 = await sdk.store.product.list({
      region_id: regionId,
    })

    return NextResponse.json({
      test1_array_collection_and_region: { count: res1.count, productsCount: res1.products.length },
      test2_string_collection_and_region: { count: res2.count, productsCount: res2.products.length },
      test3_array_collection_only: { count: res3.count, productsCount: res3.products.length },
      test4_region_only: { count: res4.count, productsCount: res4.products.length },
      config: {
        backend: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
        key_exists: !!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
        key_prefix: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.slice(0, 7),
        env: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message, 
      name: error.name,
      status: error.status,
      stack: error.stack 
    }, { status: 500 })
  }
}
