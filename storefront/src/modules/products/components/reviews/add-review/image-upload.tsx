"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { uploadReviewImages } from "@lib/data/review.service"
import { clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"

interface ImageUploadProps {
  images: File[]
  imageUrls: string[]
  onImagesChange: (images: File[]) => void
  onImageUrlsChange: (urls: string[]) => void
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  imageUrls,
  onImagesChange,
  onImageUrlsChange,
}) => {
  const t = useTranslations("product")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const totalFiles = images.length + fileArray.length

    if (totalFiles > 5) {
      setError(`Максимум 5 изображений. Уже выбрано: ${images.length}`)
      return
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const invalidFiles = fileArray.filter((file) => !validTypes.includes(file.type))

    if (invalidFiles.length > 0) {
      setError("Поддерживаются только форматы: JPG, PNG, WebP")
      return
    }

    // Validate file sizes (5MB max)
    const maxSize = 5 * 1024 * 1024
    const oversizedFiles = fileArray.filter((file) => file.size > maxSize)

    if (oversizedFiles.length > 0) {
      setError("Максимальный размер файла: 5MB")
      return
    }

    onImagesChange([...images, ...fileArray])
    setError(null)
  }

  const handleUpload = useCallback(async () => {
    if (images.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const urls = await uploadReviewImages(images)
      onImageUrlsChange([...imageUrls, ...urls])
      onImagesChange([])
      setUploadProgress(100)
    } catch (err: any) {
      console.error("[ImageUpload] Upload failed:", err)
      setError(err.message || "Ошибка загрузки изображений")
    } finally {
      setIsUploading(false)
    }
  }, [images, imageUrls, onImagesChange, onImageUrlsChange])

  // Auto-upload when images are selected
  useEffect(() => {
    if (images.length > 0 && !isUploading) {
      handleUpload()
    }
  }, [images.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const removeImage = (index: number, isUrl: boolean) => {
    if (isUrl) {
      onImageUrlsChange(imageUrls.filter((_, i) => i !== index))
    } else {
      onImagesChange(images.filter((_, i) => i !== index))
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

  const totalImages = images.length + imageUrls.length

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <label className="text-sm sm:text-base font-semibold text-gray-700">
        {t("images") || "Фотографии"} ({totalImages}/5)
      </label>

      {/* Drag & Drop Area */}
      {totalImages < 5 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={clx(
            "border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-colors cursor-pointer",
            "hover:border-gray-400 hover:bg-gray-50/50",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files)}
            disabled={isUploading || totalImages >= 5}
          />
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-xs sm:text-sm">
              {images.length === 0
                ? "Перетащите изображения сюда или нажмите для выбора"
                : `Выбрано: ${images.length} из 5`}
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs">
              JPG, PNG, WebP до 5MB
            </p>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {(images.length > 0 || imageUrls.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {images.map((file, index) => (
            <div key={`file-${index}`} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeImage(index, false)}
                  className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-sm font-bold hover:bg-red-600"
                  aria-label="Удалить изображение"
                >
                  ×
                </button>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
          {imageUrls.map((url, index) => (
            <div key={`url-${index}`} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index, true)}
                className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-sm font-bold hover:bg-red-600"
                aria-label="Удалить изображение"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Загрузка: {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2 sm:p-3">
          <p className="text-red-700 text-xs sm:text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
