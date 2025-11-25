"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
        {images[selectedImage]?.url && (
          <Image
            src={images[selectedImage].url}
            alt={`Product image ${selectedImage + 1}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
          />
        )}
        
        {/* Mobile swipe indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === selectedImage ? 'bg-red-600' : 'bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Mobile navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md lg:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md lg:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Grid - Hidden on mobile if only 1 image */}
      {images.length > 1 && (
        <div className="hidden sm:grid grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {images.slice(0, 5).map((image, idx) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(idx)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedImage 
                  ? 'border-red-600 ring-2 ring-red-600/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {image.url && (
                <Image
                  src={image.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
              {idx === 4 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
                  +{images.length - 5}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mobile thumbnail scroll */}
      {images.length > 1 && (
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedImage 
                    ? 'border-red-600' 
                    : 'border-gray-200'
                }`}
              >
                {image.url && (
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
