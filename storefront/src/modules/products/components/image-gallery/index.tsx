"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 
        Desktop Layout: 2-column grid 
        - Shows all images at once
        - Sticky scroll behavior handling is done in the parent template
      */}
      <div className="hidden lg:grid grid-cols-2 gap-4">
        {images.map((image, index) => {
          // Optional: First image can be full width if we have an odd number or just want a hero
          // For now, sticking to strict 2-col as requested ("2 immediate photos")
          return (
            <Container
              key={image.id || index}
              className="relative aspect-[3/4] w-full overflow-hidden bg-white rounded-xl shadow-none border-gray-100"
              id={`image-${index}`}
            >
              <Image
                src={image.url}
                alt={`Product image ${index + 1}`}
                fill
                priority={index <= 2}
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </Container>
          )
        })}
      </div>

      {/* 
        Mobile Layout: Horizontal Scroll Snap Carousel 
        - Native CSS scroll snap for performance
        - Clean single view
      */}
      <div className="lg:hidden w-full overflow-x-auto snap-x snap-mandatory flex gap-2 no-scrollbar px-4 -mx-4 pb-4">
        {images.map((image, index) => (
          <Container
            key={image.id || index}
            className="flex-shrink-0 relative aspect-[3/4] w-[85vw] sm:w-[50vw] snap-center first:ml-0 last:mr-0 rounded-xl overflow-hidden bg-white shadow-sm border-gray-100"
          >
            <Image
              src={image.url}
              alt={`Product image ${index + 1}`}
              fill
              priority={index === 0}
              className="object-contain" // Keeping 'contain' for full visibility as requested
              sizes="85vw"
            />
          </Container>
        ))}
        
        {/* Helper text or indicators could go here if needed, but native scroll is intuitive */}
      </div>
      
      {/* Mobile Indicator dots (Optional enhancement) */}
      {images.length > 1 && (
         <div className="lg:hidden flex justify-center gap-2 -mt-2">
            {images.map((_, idx) => (
              <div key={idx} className="w-1.5 h-1.5 rounded-full bg-gray-300" /> 
            ))}
         </div>
      )}
    </div>
  )
}

export default ImageGallery
