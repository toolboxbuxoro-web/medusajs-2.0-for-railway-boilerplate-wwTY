import { sdk } from "@/lib/config"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const apiKeyPrefix = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.slice(0, 8)
    
    // @ts-ignore
    const { collections } = await sdk.store.collection.list(
      { limit: 100 },
      { next: { revalidate: 0 } }
    )
    
    return NextResponse.json({
      debug: {
        backendUrl,
        apiKeyPrefix: `${apiKeyPrefix}...`,
        timestamp: new Date().toISOString(),
      },
      collections: collections.map((c: any) => ({
        id: c.id,
        title: c.title,
        handle: c.handle
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
