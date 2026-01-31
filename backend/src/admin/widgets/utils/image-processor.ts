/**
 * Utility for processing and uploading images in Medusa Admin
 */

export type UploadResponse = {
  files?: Array<{
    id?: string
    url?: string
    file_url?: string
  }>
}

/**
 * Converts a File to WebP format using the browser's Canvas API.
 * This can be a heavy operation, so it's wrapped in a Promise.
 */
export const convertToWebP = async (file: File, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Check if browser supports required APIs
    if (typeof window === "undefined" || !window.HTMLCanvasElement) {
      return resolve(file) // Fallback to original file
    }

    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      
      if (!ctx) {
        reject(new Error("Canvas context not available"))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert to WebP"))
            return
          }
          const baseName = file.name.replace(/\.[^.]+$/, "")
          const webpFile = new File([blob], `${baseName}.webp`, { type: "image/webp" })
          resolve(webpFile)
        },
        "image/webp",
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image for conversion"))
    }
    
    img.src = url
  })
}

/**
 * Uploads a file to Medusa's admin upload endpoint
 */
export const uploadFile = async (file: File): Promise<{ url: string; id: string }> => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch("/admin/uploads", {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || "Upload failed")
  }

  const json = (await response.json()) as UploadResponse
  const uploaded = json.files?.[0]
  
  const url = uploaded?.url || uploaded?.file_url
  const id = uploaded?.id

  if (!url || !id) {
    throw new Error("Upload response missing file details")
  }

  return { url, id }
}
