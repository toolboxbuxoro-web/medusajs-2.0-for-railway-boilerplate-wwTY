import { Client } from "minio"
import { loadEnv } from "@medusajs/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const main = async () => {
  const endPoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY
  const bucket = process.env.MINIO_BUCKET || "medusa-media"
  
  // Logic from config
  const port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 443
  const useSSL = process.env.MINIO_USE_SSL !== undefined ? process.env.MINIO_USE_SSL === "true" : true

  console.log("----------------------------------------")
  console.log("🛠️  Testing MinIO Connection...")
  console.log("----------------------------------------")
  console.log("Config:")
  console.log(`- EndPoint: ${endPoint}`)
  console.log(`- Port:     ${port}`)
  console.log(`- Use SSL:  ${useSSL}`)
  console.log(`- Bucket:   ${bucket}`)
  console.log(`- AccessKey: ${accessKey ? "******" + accessKey.slice(-4) : "MISSING"}`)
  console.log("----------------------------------------")

  if (!endPoint || !accessKey || !secretKey) {
    console.error("❌ Error: Missing required environment variables.")
    return
  }

  const client = new Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  })

  try {
    console.log("⏳ Attempting to list buckets...")
    const buckets = await client.listBuckets()
    console.log("✅ Connection Successful!")
    console.log(`Found ${buckets.length} buckets.`)
    
    const bucketExists = buckets.some(b => b.name === bucket)
    if (bucketExists) {
      console.log(`✅ Bucket '${bucket}' exists.`)
    } else {
      console.warn(`⚠️ Bucket '${bucket}' NOT found via listBuckets (check permissions or name).`)
    }

  } catch (error: any) {
    console.error("❌ Connection Failed:")
    console.error(error)
    console.log("----------------------------------------")
    console.log("💡 Troubleshooting tips:")
    if (error.code === "ECONNREFUSED") {
      console.log("- Check if the Host and Port are correct.")
      console.log("- If using internal Railway host via HTTP, try setting MINIO_USE_SSL=false and MINIO_PORT=9000 (or 80).")
    }
    if (error.code === "TlsException" || error.message?.includes("SSL")) {
      console.log("- SSL Error. Try setting MINIO_USE_SSL=false.")
    }
    if (error.message?.includes("Forbidden") || error.code === "AccessDenied") {
      console.log("- Check your Access Key and Secret Key.")
    }
  }
}

main()
