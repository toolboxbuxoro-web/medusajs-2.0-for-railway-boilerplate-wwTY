import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IFileModuleService } from "@medusajs/framework/types"
import busboy from "busboy"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

interface FileData {
  filename: string
  mimeType: string
  content: Buffer
  size: number
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const customerId = (req as any).auth_context?.actor_id
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  console.log(`[POST /store/uploads] Request ${requestId} - Customer: ${customerId || "unauthorized"}`)

  if (!customerId) {
    console.warn(`[POST /store/uploads] Request ${requestId} - Unauthorized access attempt`)
    return res.status(401).json({ error: "Unauthorized" })
  }

  const files: FileData[] = []

  return new Promise<void>((resolve, reject) => {
    try {
      // Parse multipart/form-data using busboy
      // Get the raw request stream from Express/Fastify
      const rawReq = (req as any).raw || req
      const bb = busboy({ headers: req.headers as any, limits: { fileSize: MAX_FILE_SIZE } })

      bb.on("file", (name, file, info) => {
        const { filename, encoding, mimeType } = info

        if (files.length >= MAX_FILES) {
          file.resume()
          return
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
          console.warn(`[POST /store/uploads] Request ${requestId} - Invalid MIME type: ${filename} (${mimeType})`)
          file.resume()
          return
        }

        const chunks: Buffer[] = []
        let totalSize = 0

        file.on("data", (chunk: Buffer) => {
          totalSize += chunk.length
          if (totalSize > MAX_FILE_SIZE) {
            console.warn(`[POST /store/uploads] Request ${requestId} - File too large: ${filename}`)
            file.resume()
            return
          }
          chunks.push(chunk)
        })

        file.on("end", () => {
          if (totalSize <= MAX_FILE_SIZE && chunks.length > 0) {
            const buffer = Buffer.concat(chunks)
            files.push({
              filename: filename || "unknown",
              mimeType,
              content: buffer,
              size: totalSize,
            })
            console.log(`[POST /store/uploads] Request ${requestId} - File received: ${filename} (${mimeType}, ${(totalSize / 1024).toFixed(2)}KB)`)
          }
        })

        file.on("error", (err) => {
          console.error(`[POST /store/uploads] Request ${requestId} - File stream error for ${filename}:`, err)
        })
      })

      bb.on("finish", async () => {
        try {
          console.log(`[POST /store/uploads] Request ${requestId} - Received ${files.length} file(s)`)

          if (files.length === 0) {
            console.warn(`[POST /store/uploads] Request ${requestId} - No files provided`)
            res.status(400).json({ error: "No files provided" })
            resolve()
            return
          }

          if (files.length > MAX_FILES) {
            console.warn(`[POST /store/uploads] Request ${requestId} - Too many files: ${files.length} (max: ${MAX_FILES})`)
            res.status(400).json({ 
              error: `Maximum ${MAX_FILES} files allowed per request` 
            })
            resolve()
            return
          }

          // Upload files using File Module
          const fileModuleService: IFileModuleService = req.scope.resolve(Modules.FILE)

          console.log(`[POST /store/uploads] Request ${requestId} - Starting upload of ${files.length} file(s)`)

          const uploadPromises = files.map(async (fileData, index) => {
            try {
              console.log(`[POST /store/uploads] Request ${requestId} - Uploading file ${index + 1}/${files.length}: ${fileData.filename}`)

              // Use File Module's createFiles method (standard Medusa File Module API)
              const uploadResult = await (fileModuleService as any).createFiles([
                {
                  filename: fileData.filename,
                  mimeType: fileData.mimeType,
                  content: fileData.content.toString("binary"),
                }
              ])

              // createFiles returns an array
              const result = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult

              if (!result || !result.url) {
                throw new Error(`File Module returned invalid result for ${fileData.filename}`)
              }

              console.log(`[POST /store/uploads] Request ${requestId} - Successfully uploaded: ${fileData.filename} -> ${result.url}`)

              return {
                id: result.id || result.key || result.url,
                url: result.url,
                file_url: result.url, // For compatibility
              }
            } catch (fileError: any) {
              console.error(`[POST /store/uploads] Request ${requestId} - Failed to upload file ${fileData.filename}:`, {
                error: fileError.message,
                stack: fileError.stack,
                fileName: fileData.filename,
                fileSize: fileData.size,
                fileType: fileData.mimeType
              })
              throw fileError
            }
          })

          const uploadedFiles = await Promise.all(uploadPromises)

          console.log(`[POST /store/uploads] Request ${requestId} - Successfully uploaded ${uploadedFiles.length} file(s)`)

          res.status(200).json({
            files: uploadedFiles,
          })
          resolve()
        } catch (uploadError: any) {
          console.error(`[POST /store/uploads] Request ${requestId} - Upload error:`, {
            error: uploadError.message,
            stack: uploadError.stack,
            filesCount: files.length
          })
          res.status(500).json({
            error: "Failed to upload files. Please try again later.",
          })
          resolve()
        }
      })

      bb.on("error", (err) => {
        console.error(`[POST /store/uploads] Request ${requestId} - Busboy error:`, err)
        res.status(400).json({ error: "Failed to parse form data" })
        resolve()
      })

      // Pipe the request to busboy
      if (rawReq.pipe) {
        rawReq.pipe(bb)
      } else if (rawReq.on) {
        rawReq.on("data", (chunk: Buffer) => bb.write(chunk))
        rawReq.on("end", () => bb.end())
      } else {
        throw new Error("Cannot access request stream")
      }
    } catch (error: any) {
      console.error(`[POST /store/uploads] Request ${requestId} - Error:`, {
        error: error.message,
        stack: error.stack,
        customerId,
        filesCount: files.length
      })
      res.status(500).json({
        error: "Failed to upload files. Please try again later.",
      })
      resolve()
    }
  })
}
