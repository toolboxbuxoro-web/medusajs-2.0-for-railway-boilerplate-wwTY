import { Review, CreateReviewPayload, CanReviewResponse } from "./review.types"

function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
}

export interface GetReviewsOptions {
  limit?: number
  offset?: number
  sort?: string
  rating?: number
  withPhotos?: boolean
}

export const getReviews = async (
  productId: string,
  options: GetReviewsOptions = {}
): Promise<{ 
  reviews: Review[]; 
  total: number; 
  average_rating: number;
  distribution: Record<number, number>;
}> => {
  if (!productId || productId === "undefined" || productId === "null") {
    console.warn(`[getReviews] Invalid productId: ${productId}. Skipping fetch.`)
    return {
      reviews: [],
      total: 0,
      average_rating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const { limit = 10, offset = 0, sort = "newest", rating, withPhotos } = options
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    sort,
  })
  
  // Добавляем фильтры если они есть (backend может не поддерживать, но добавим для будущего)
  if (rating) {
    params.append("rating", rating.toString())
  }
  if (withPhotos) {
    params.append("with_photos", "true")
  }

  const resp = await fetch(
    `${backendBaseUrl()}/store/products/${productId}/reviews?${params.toString()}`,
    {
      next: { tags: ["reviews", `reviews-${productId}`] },
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      credentials: "include",
    }
  )

  if (!resp.ok) {
    throw new Error("Failed to fetch reviews")
  }

  const data = await resp.json()
  
  // Гарантируем правильную структуру данных
  return {
    reviews: Array.isArray(data.reviews) ? data.reviews : [],
    total: typeof data.total === "number" ? data.total : 0,
    average_rating: typeof data.average_rating === "number" ? data.average_rating : 0,
    distribution: data.distribution && typeof data.distribution === "object" 
      ? data.distribution 
      : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  }
}

/**
 * Check if the current customer can review the product.
 */
export const checkCanReview = async (productId: string): Promise<CanReviewResponse> => {
  if (!productId || productId === "undefined" || productId === "null") {
    console.warn(`[checkCanReview] Invalid productId: ${productId}. Skipping fetch.`)
    return { can_review: false, reason: "error" }
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[checkCanReview] Request ${requestId} - Checking eligibility for product ${productId}`)

  try {
    const resp = await fetch(`${backendBaseUrl()}/store/products/${productId}/can-review`, {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      cache: "no-store",
      credentials: "include", // Send cookies for auth
    })

    if (!resp.ok) {
      console.warn(`[checkCanReview] Request ${requestId} - Request failed:`, {
        status: resp.status,
        statusText: resp.statusText
      })
      return { can_review: false }
    }

    const result = await resp.json()
    console.log(`[checkCanReview] Request ${requestId} - Eligibility result:`, result)
    return result
  } catch (error: any) {
    console.error(`[checkCanReview] Request ${requestId} - Error:`, {
      error: error.message,
      stack: error.stack,
      productId
    })
    return { can_review: false }
  }
}

/**
 * Upload images for review.
 * Converts images to WebP format and uploads them to the server.
 */
export const uploadReviewImages = async (files: File[]): Promise<string[]> => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[uploadReviewImages] Request ${requestId} - Starting upload of ${files.length} file(s)`)

  if (!files || files.length === 0) {
    console.log(`[uploadReviewImages] Request ${requestId} - No files provided, returning empty array`)
    return []
  }

  if (files.length > 5) {
    console.error(`[uploadReviewImages] Request ${requestId} - Too many files: ${files.length} (max: 5)`)
    throw new Error("Maximum 5 images allowed")
  }

  // Convert files to WebP format
  console.log(`[uploadReviewImages] Request ${requestId} - Converting ${files.length} file(s) to WebP...`)
  
  const webpFiles = await Promise.all(
    files.map(async (file, index) => {
      try {
        // Check if already WebP
        if (file.type === "image/webp") {
          console.log(`[uploadReviewImages] Request ${requestId} - File ${index + 1} (${file.name}) is already WebP, skipping conversion`)
          return file
        }

        console.log(`[uploadReviewImages] Request ${requestId} - Converting file ${index + 1} (${file.name}) to WebP...`)

        return new Promise<File>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas")
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext("2d")
              if (!ctx) {
                console.error(`[uploadReviewImages] Request ${requestId} - Canvas context not available for file ${file.name}`)
                reject(new Error("Canvas context not available"))
                return
              }
              ctx.drawImage(img, 0, 0)
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.error(`[uploadReviewImages] Request ${requestId} - Failed to convert ${file.name} to WebP blob`)
                    reject(new Error("Failed to convert to WebP"))
                    return
                  }
                  const baseName = file.name.replace(/\.[^.]+$/, "")
                  const webpFile = new File([blob], `${baseName}.webp`, { type: "image/webp" })
                  console.log(`[uploadReviewImages] Request ${requestId} - Successfully converted ${file.name} to WebP (${(blob.size / 1024).toFixed(2)}KB)`)
                  resolve(webpFile)
                },
                "image/webp",
                0.85 // quality 85%
              )
            } catch (conversionError: any) {
              console.error(`[uploadReviewImages] Request ${requestId} - Error converting ${file.name} to WebP:`, conversionError)
              reject(conversionError)
            }
          }
          img.onerror = (error) => {
            console.error(`[uploadReviewImages] Request ${requestId} - Failed to load image ${file.name}:`, error)
            reject(new Error("Failed to load image"))
          }
          img.src = URL.createObjectURL(file)
        })
      } catch (fileError: any) {
        console.error(`[uploadReviewImages] Request ${requestId} - Error processing file ${file.name}:`, {
          error: fileError.message,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
        throw fileError
      }
    })
  )

  console.log(`[uploadReviewImages] Request ${requestId} - Conversion complete, uploading ${webpFiles.length} file(s)...`)

  // Upload files
  const formData = new FormData()
  webpFiles.forEach((file) => {
    formData.append("files", file)
  })

  try {
    const resp = await fetch(`${backendBaseUrl()}/store/uploads`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      credentials: "include",
      body: formData,
      cache: "no-store",
    })

    if (!resp.ok) {
      const errorJson = await resp.json().catch(() => ({}))
      console.error(`[uploadReviewImages] Request ${requestId} - Upload failed:`, {
        status: resp.status,
        statusText: resp.statusText,
        error: errorJson.error || errorJson.message
      })
      throw new Error(errorJson.error || "Failed to upload images")
    }

    const { files: uploadedFiles } = await resp.json()
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.error(`[uploadReviewImages] Request ${requestId} - No files returned from server`)
      throw new Error("No files were uploaded")
    }

    // Extract URLs from uploaded files
    const urls = uploadedFiles.map((file: any) => file.url || file.file_url).filter(Boolean)
    
    if (urls.length !== webpFiles.length) {
      console.warn(`[uploadReviewImages] Request ${requestId} - Mismatch: uploaded ${webpFiles.length} files but got ${urls.length} URLs`)
    }

    console.log(`[uploadReviewImages] Request ${requestId} - Successfully uploaded ${urls.length} file(s)`)
    return urls
  } catch (uploadError: any) {
    console.error(`[uploadReviewImages] Request ${requestId} - Upload error:`, {
      error: uploadError.message,
      stack: uploadError.stack,
      filesCount: webpFiles.length
    })
    throw uploadError
  }
}

/**
 * Submit a new review for a product.
 */
export const createReview = async (payload: CreateReviewPayload): Promise<Review> => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`[createReview] Request ${requestId} - Creating review for product ${payload.product_id}`, {
    rating: payload.rating,
    hasComment: !!payload.comment,
    hasPros: !!payload.pros,
    hasCons: !!payload.cons,
    imagesCount: payload.images?.length || 0
  })

  const { product_id, ...data } = payload
  
  try {
    const resp = await fetch(`${backendBaseUrl()}/store/products/${product_id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      credentials: "include", // Send cookies for auth
      body: JSON.stringify(data),
      cache: "no-store",
    })

    if (!resp.ok) {
      const errorJson = await resp.json().catch(() => ({}))
      console.error(`[createReview] Request ${requestId} - Failed to create review:`, {
        status: resp.status,
        statusText: resp.statusText,
        error: errorJson.error || errorJson.message
      })
      throw new Error(errorJson.message || errorJson.error || "Failed to create review")
    }

    const { review } = await resp.json()
    
    if (!review || !review.id) {
      console.error(`[createReview] Request ${requestId} - Invalid response: no review ID`, review)
      throw new Error("Invalid response from server")
    }

    console.log(`[createReview] Request ${requestId} - Review created successfully: ${review.id}`)
    return review
  } catch (error: any) {
    console.error(`[createReview] Request ${requestId} - Error:`, {
      error: error.message,
      stack: error.stack,
      productId: product_id
    })
    throw error
  }
}
