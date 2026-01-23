"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { createReview, checkCanReview, uploadReviewImages } from "@lib/data/review.service"
import { Review } from "@lib/data/review.types"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import StarIcon from "@modules/common/icons/star"
import { useTranslations } from "next-intl"

interface AddReviewFormProps {
  productId: string
  onSuccess: (review: Review) => void
  isLoggedIn: boolean
  onLoginClick: () => void
}

type EligibilityReason = "already_reviewed" | "no_completed_order" | "error" | null

const AddReviewForm: React.FC<AddReviewFormProps> = ({
  productId,
  onSuccess,
  isLoggedIn,
  onLoginClick,
}) => {
  const t = useTranslations("product")
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [pros, setPros] = useState("")
  const [cons, setCons] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [eligibilityReason, setEligibilityReason] = useState<EligibilityReason>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchEligibility = useCallback(async () => {
    if (!isLoggedIn) return
    
    console.log(`[AddReviewForm] Fetching eligibility for product ${productId}`)
    setIsLoading(true)
    try {
      const res = await checkCanReview(productId)
      console.log(`[AddReviewForm] Eligibility result:`, res)
      setCanReview(res.can_review)
      setEligibilityReason(res.reason || null)
    } catch (err) {
      console.error(`[AddReviewForm] Failed to check eligibility:`, err)
      setCanReview(false)
      setEligibilityReason("error")
      setError(t("review_error"))
    } finally {
      setIsLoading(false)
    }
  }, [productId, isLoggedIn, t])

  useEffect(() => {
    fetchEligibility()
  }, [fetchEligibility])

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const totalFiles = images.length + fileArray.length

    console.log(`[AddReviewForm] Selecting ${fileArray.length} file(s), total will be ${totalFiles}`)

    if (totalFiles > 5) {
      console.warn(`[AddReviewForm] Too many files selected: ${totalFiles} (max: 5)`)
      setError(`Максимум 5 изображений. Уже выбрано: ${images.length}`)
      return
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      console.warn(`[AddReviewForm] Invalid file types:`, invalidFiles.map(f => ({ name: f.name, type: f.type })))
      setError("Поддерживаются только форматы: JPG, PNG, WebP")
      return
    }

    // Validate file sizes (5MB max)
    const maxSize = 5 * 1024 * 1024
    const oversizedFiles = fileArray.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      console.warn(`[AddReviewForm] Oversized files:`, oversizedFiles.map(f => ({ name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + "MB" })))
      setError("Максимальный размер файла: 5MB")
      return
    }

    console.log(`[AddReviewForm] Files validated successfully, adding ${fileArray.length} file(s)`)
    setImages(prev => [...prev, ...fileArray])
    setError(null)
  }

  const handleImageUpload = async () => {
    if (images.length === 0) return

    console.log(`[AddReviewForm] Starting upload of ${images.length} image(s)`)
    setIsUploadingImages(true)
    setUploadProgress(0)
    setError(null)

    try {
      const urls = await uploadReviewImages(images)
      console.log(`[AddReviewForm] Successfully uploaded ${urls.length} image(s)`)
      setImageUrls(urls)
      setUploadProgress(100)
    } catch (err: any) {
      console.error(`[AddReviewForm] Image upload failed:`, {
        error: err.message,
        stack: err.stack,
        imagesCount: images.length
      })
      setError(err.message || "Ошибка загрузки изображений")
      setIsUploadingImages(false)
    } finally {
      setIsUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    // If index is in the images array (not yet uploaded)
    if (index < images.length) {
      setImages(prev => prev.filter((_, i) => i !== index))
    } else {
      // If index is in the imageUrls array (already uploaded)
      const urlIndex = index - images.length
      setImageUrls(prev => prev.filter((_, i) => i !== urlIndex))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleImageSelect(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
      console.log(`[AddReviewForm] Form submission started for product ${productId}`, {
      rating,
      hasTitle: !!title,
      hasComment: !!comment,
      hasPros: !!pros,
      hasCons: !!cons,
      imagesCount: images.length,
      imageUrlsCount: imageUrls.length
    })

    if (rating === 0) {
      console.warn(`[AddReviewForm] Submission rejected: no rating selected`)
      setError(t("select_rating"))
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Upload images first if there are any
    let finalImageUrls = imageUrls
    if (images.length > 0 && imageUrls.length === 0) {
      console.log(`[AddReviewForm] Uploading ${images.length} image(s) before submitting review...`)
      try {
        finalImageUrls = await uploadReviewImages(images)
        console.log(`[AddReviewForm] Images uploaded successfully: ${finalImageUrls.length} URL(s)`)
        setImageUrls(finalImageUrls)
      } catch (err: any) {
        console.error(`[AddReviewForm] Failed to upload images before submission:`, {
          error: err.message,
          stack: err.stack
        })
        setError(err.message || "Ошибка загрузки изображений")
        setIsSubmitting(false)
        return
      }
    }

    try {
      console.log(`[AddReviewForm] Creating review with ${finalImageUrls.length} image(s)...`)
      const review = await createReview({
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      })
      
      console.log(`[AddReviewForm] Review created successfully: ${review.id}`)
      setSuccess(true)
      onSuccess(review)
      setTitle("")
      setComment("")
      setPros("")
      setCons("")
      setRating(0)
      setImages([])
      setImageUrls([])
    } catch (err: any) {
      console.error(`[AddReviewForm] Failed to create review:`, {
        error: err.message,
        stack: err.stack,
        productId,
        rating
      })
      setError(err.message || t("review_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 rounded-3xl p-8 text-center mt-12 border border-dashed border-gray-200">
        <Heading level="h2" className="text-gray-900 mb-4">{t("write_review")}</Heading>
        <Text className="text-gray-500 mb-6">{t("only_buyers_can_review")}</Text>
        <Button 
          variant="primary" 
          className="bg-gray-900 rounded-2xl px-8 h-12"
          onClick={onLoginClick}
        >
          {t("login_or_register")}
        </Button>
      </div>
    )
  }

  if (isLoading) return null

  if (canReview === false && !success) {
    const getMessageKey = (): "already_reviewed" | "only_after_delivery" | "review_error" => {
      if (eligibilityReason === "already_reviewed") {
        return "already_reviewed"
      }
      if (eligibilityReason === "no_completed_order") {
        return "only_after_delivery"
      }
      if (eligibilityReason === "error") {
        return "review_error"
      }
      return "only_after_delivery"
    }

    return (
      <div className="bg-gray-50 rounded-3xl p-8 text-center mt-12 border border-gray-100">
        <Heading level="h2" className="text-gray-900 mb-3">
          {t("write_review")}
        </Heading>
        <Text className="text-gray-500">
          {t(getMessageKey())}
        </Text>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-50/50 rounded-3xl p-8 text-center mt-12 border border-green-100">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          ✓
        </div>
        <Heading level="h2" className="text-gray-900 mb-2">{t("review_sent")}</Heading>
        <Text className="text-gray-600">{t("review_sent_text")}</Text>
      </div>
    )
  }

  return (
    <div className="mt-12 p-8 bg-gray-50 rounded-[40px] border border-gray-100">
      <Heading level="h2" className="text-2xl font-bold text-gray-900 mb-2">{t("leave_review")}</Heading>
      <Text className="text-gray-500 mb-8">{t("share_experience")}</Text>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t("your_rating")} *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-95"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <StarIcon
                  size={32}
                  className={clx(
                    "transition-colors",
                    star <= (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-bold text-gray-900">
                {rating === 5 ? t("rating_excellent") : rating === 4 ? t("rating_good") : rating === 3 ? t("rating_normal") : rating === 2 ? t("rating_bad") : t("rating_terrible")}
              </span>
            )}
          </div>
        </div>

        {/* Title Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t("title") || "Заголовок"}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full rounded-2xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 text-[15px]"
            placeholder={t("title_placeholder") || "Краткое описание вашего отзыва..."}
          />
          <span className="text-xs text-gray-400 text-right">{title.length}/200</span>
        </div>

        {/* Pros Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-green-500">✓</span> {t("pros") || "Достоинства"}
          </label>
          <input
            type="text"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            maxLength={500}
            className="w-full rounded-2xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 text-[15px]"
            placeholder={t("pros_placeholder") || "Что понравилось в товаре?"}
          />
          <span className="text-xs text-gray-400 text-right">{pros.length}/500</span>
        </div>

        {/* Cons Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-red-500">✗</span> {t("cons") || "Недостатки"}
          </label>
          <input
            type="text"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            maxLength={500}
            className="w-full rounded-2xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-gray-400 text-[15px]"
            placeholder={t("cons_placeholder") || "Что не понравилось?"}
          />
          <span className="text-xs text-gray-400 text-right">{cons.length}/500</span>
        </div>

        {/* Comment Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t("comment") || "Комментарий"}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded-2xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 text-[15px]"
            placeholder={t("comment_placeholder") || "Расскажите подробнее о товаре..."}
          />
          <span className="text-xs text-gray-400 text-right">{comment.length}/2000</span>
        </div>

        {/* Image Upload Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">
            {t("images") || "Фотографии"} ({images.length}/5)
          </label>
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={clx(
              "border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer",
              "hover:border-gray-400 hover:bg-gray-50/50",
              images.length >= 5 && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => images.length < 5 && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleImageSelect(e.target.files)}
              disabled={images.length >= 5}
            />
            <div className="flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <Text className="text-gray-500 text-sm">
                {images.length === 0 
                  ? "Перетащите изображения сюда или нажмите для выбора"
                  : `Выбрано: ${images.length} из 5`}
              </Text>
              <Text className="text-gray-400 text-xs">
                JPG, PNG, WebP до 5MB
              </Text>
            </div>
          </div>

          {/* Image Previews */}
          {(images.length > 0 || imageUrls.length > 0) && (
            <div className="grid grid-cols-5 gap-3 mt-4">
              {images.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ×
                  </button>
                  {isUploadingImages && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ))}
              {imageUrls.map((url, index) => (
                <div key={`url-${index}`} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={url}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(images.length + index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploadingImages && uploadProgress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <Text className="text-xs text-gray-500 mt-1">
                Загрузка: {uploadProgress}%
              </Text>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full md:w-auto px-12 h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {isSubmitting ? t("submitting") : t("submit_review")}
        </Button>
      </form>
    </div>
  )
}

export default AddReviewForm
