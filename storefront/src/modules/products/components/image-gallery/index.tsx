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
    <div className="flex flex-col gap-4">
      {/* Desktop Layout: Vertical thumbnails + Main image */}
      <div className="hidden lg:flex gap-4">
        {/* Vertical Thumbnails */}
        {images.length > 1 && (
          <div className="flex flex-col gap-2 w-20 flex-shrink-0">
            {images.map((image, idx) => (
              <button
                key={image.id || idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  idx === selectedImage
                    ? "border-red-600 shadow-md"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain bg-white"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className="flex-1 relative">
          <div className="relative aspect-square bg-white rounded-xl overflow-hidden border border-gray-200">
            {images[selectedImage]?.url && (
              <Image
                src={images[selectedImage].url}
                alt={`Product image ${selectedImage + 1}`}
                fill
                priority
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
          </div>
          
          {/* Navigation arrows for desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Layout: Horizontal Scroll Snap Carousel */}
      <div className="lg:hidden">
        <div className="relative">
          <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-2 no-scrollbar pb-2">
            {images.map((image, index) => (
              <div
                key={image.id || index}
                className="flex-shrink-0 relative aspect-square w-[85vw] sm:w-[70vw] snap-center rounded-xl overflow-hidden bg-white border border-gray-200"
              >
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  priority={index === 0}
                  className="object-contain p-2"
                  sizes="85vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Indicator dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === selectedImage ? "bg-red-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Mobile Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {images.map((image, idx) => (
              <button
                key={image.id || idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedImage
                    ? "border-red-600"
                    : "border-gray-200"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain bg-white"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
