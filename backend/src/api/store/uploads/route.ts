import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IFileModuleService } from "@medusajs/framework/types"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

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

  try {
    // Get files from request
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    console.log(`[POST /store/uploads] Request ${requestId} - Received ${files.length} file(s)`)

    if (!files || files.length === 0) {
      console.warn(`[POST /store/uploads] Request ${requestId} - No files provided`)
      return res.status(400).json({ error: "No files provided" })
    }

    if (files.length > MAX_FILES) {
      console.warn(`[POST /store/uploads] Request ${requestId} - Too many files: ${files.length} (max: ${MAX_FILES})`)
      return res.status(400).json({ 
        error: `Maximum ${MAX_FILES} files allowed per request` 
      })
    }

    // Validate files
    for (const file of files) {
      if (!file || !(file instanceof File)) {
        console.error(`[POST /store/uploads] Request ${requestId} - Invalid file object:`, {
          file: file ? Object.keys(file) : null,
          isFile: file instanceof File
        })
        return res.status(400).json({ error: "Invalid file provided" })
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`[POST /store/uploads] Request ${requestId} - File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB, max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
        return res.status(400).json({ 
          error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        })
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.warn(`[POST /store/uploads] Request ${requestId} - Invalid MIME type: ${file.name} (${file.type})`)
        return res.status(400).json({ 
          error: `File ${file.name} has invalid type. Allowed types: JPG, PNG, WebP` 
        })
      }

      console.log(`[POST /store/uploads] Request ${requestId} - File validated: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)}KB)`)
    }

    // Upload files using File Module
    const fileModuleService: IFileModuleService = req.scope.resolve(Modules.FILE)

    console.log(`[POST /store/uploads] Request ${requestId} - Starting upload of ${files.length} file(s)`)

    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`[POST /store/uploads] Request ${requestId} - Uploading file ${index + 1}/${files.length}: ${file.name}`)
        
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (!buffer || buffer.length === 0) {
          throw new Error(`Empty buffer for file ${file.name}`)
        }

        const uploadResult = await fileModuleService.create({
          filename: file.name,
          mimeType: file.type,
          content: buffer.toString("binary"),
        })

        if (!uploadResult || !uploadResult.url) {
          throw new Error(`File Module returned invalid result for ${file.name}`)
        }

        console.log(`[POST /store/uploads] Request ${requestId} - Successfully uploaded: ${file.name} -> ${uploadResult.url}`)

        return {
          id: uploadResult.id,
          url: uploadResult.url,
          file_url: uploadResult.url, // For compatibility
        }
      } catch (fileError: any) {
        console.error(`[POST /store/uploads] Request ${requestId} - Failed to upload file ${file.name}:`, {
          error: fileError.message,
          stack: fileError.stack,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
        throw fileError
      }
    })

    const uploadedFiles = await Promise.all(uploadPromises)

    console.log(`[POST /store/uploads] Request ${requestId} - Successfully uploaded ${uploadedFiles.length} file(s)`)

    res.status(200).json({
      files: uploadedFiles,
    })
  } catch (error: any) {
    console.error(`[POST /store/uploads] Request ${requestId} - Error:`, {
      error: error.message,
      stack: error.stack,
      customerId,
      filesCount: files?.length || 0
    })
    return res.status(500).json({
      error: "Failed to upload files. Please try again later.",
    })
  }
}
