"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const isInternalScroll = useRef(false)

  // Zoom effect state
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null)

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Centralized scroll synchronization
  useEffect(() => {
    if (!isInternalScroll.current) return

    // 1. Sync Desktop Main Slider
    if (scrollRef.current) {
      const container = scrollRef.current
      const target = container.children[selectedImage] as HTMLElement
      if (target) {
        // Pixel-perfect scroll for desktop (which has gap)
        const containerRect = container.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const scrollTarget = targetRect.left - containerRect.left + container.scrollLeft
        
        container.scrollTo({
          left: scrollTarget,
          behavior: 'smooth',
        })
      }
    }

    // 2. Sync Mobile Main Slider
    if (mobileScrollRef.current) {
      const container = mobileScrollRef.current
      const width = container.offsetWidth
      container.scrollTo({
        left: width * selectedImage,
        behavior: 'smooth',
      })
    }

    // 3. Sync Thumbnails
    if (thumbRef.current) {
      const targetThumb = thumbRef.current.children[selectedImage] as HTMLElement
      if (targetThumb) {
        targetThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }

    const timer = setTimeout(() => {
      isInternalScroll.current = false
    }, 800)
    
    return () => clearTimeout(timer)
  }, [selectedImage])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isLightboxOpen, images.length])

  const handleThumbnailClick = (idx: number) => {
    if (idx < 0 || idx >= images.length) return
    isInternalScroll.current = true
    setSelectedImage(idx)
  }

  const handleArrowScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.offsetWidth / 2
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Layout: Fixed scrolling logic, removed CSS snap which can conflict with JS scrollTo */}
      <div className="hidden lg:flex gap-6 items-start">
        {/* Vertical Thumbnails Carousel */}
        {images.length > 1 && (
          <div className="relative group w-24 flex-shrink-0">
            <button 
              className="absolute -top-6 left-1/2 -translate-x-1/2 p-1 text-gray-400 hover:text-red-600 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => thumbRef.current?.scrollBy({ top: -150, behavior: 'smooth' })}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>

            <div 
              ref={thumbRef}
              className="flex flex-col gap-3 h-[600px] overflow-y-auto no-scrollbar py-2 scroll-smooth"
            >
              {images.map((image, idx) => (
                <button
                  key={image.id || idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${
                    idx === selectedImage
                      ? "border-red-600 ring-4 ring-red-50"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-contain bg-white"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>

            <button 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 p-1 text-gray-400 hover:text-red-600 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => thumbRef.current?.scrollBy({ top: 150, behavior: 'smooth' })}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        )}

        {/* Main Images Slider (2 Visible at once) */}
        <div className="flex-1 relative group/main overflow-hidden">
          <div 
            ref={scrollRef}
            onScroll={(e) => {
              if (isInternalScroll.current) return
              const scrollLeft = e.currentTarget.scrollLeft
              const slideWidth = (e.currentTarget.offsetWidth + 16) / 2 // Accounts for gap-4
              const index = Math.round(scrollLeft / slideWidth)
              if (index !== selectedImage && index < images.length) {
                // Keep selectedImage state in sync with manual scrolling
                setSelectedImage(index)
                
                // Also scroll thumbnail carousel to keep active one visible
                if (thumbRef.current) {
                  const targetThumb = thumbRef.current.children[index] as HTMLElement
                  if (targetThumb) {
                    targetThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                }
              }
            }}
            className="flex gap-4 overflow-x-auto no-scrollbar h-[600px] items-stretch relative"
          >
            {images.map((image, idx) => (
              <div 
                key={image.id || idx}
                onClick={() => openLightbox(idx)}
                onMouseEnter={() => setHoveredImageIndex(idx)}
                onMouseLeave={() => setHoveredImageIndex(null)}
                onMouseMove={handleMouseMove}
                className="w-[calc(50%-8px)] flex-shrink-0 relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in hover:border-gray-300 transition-all z-10 group/image"
              >
                <Image
                  src={image.url}
                  alt={`Product image ${idx + 1}`}
                  fill
                  priority={idx < 4}
                  className="object-contain p-4"
                  sizes="(max-width: 1280px) 35vw, 450px"
                />
                
                {/* Zoom Overlay - appears on hover */}
                {hoveredImageIndex === idx && (
                  <div 
                    className="absolute inset-0 bg-white/95 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                      backgroundImage: `url(${image.url})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '200%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Large Navigation Arrows */}
          {images.length > 2 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleArrowScroll('left'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100 opacity-100 lg:opacity-0 group-hover/main:opacity-100 z-30 transition-all active:scale-95"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleArrowScroll('right'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100 opacity-100 lg:opacity-0 group-hover/main:opacity-100 z-30 transition-all active:scale-95"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Layout: Kept with snap behavior for tactile feel */}
      <div className="lg:hidden">
        <div className="relative group/mobile" data-testid="image-gallery">
          <div 
            ref={mobileScrollRef}
            className="w-full overflow-x-auto snap-x snap-mandatory flex gap-0 no-scrollbar pb-4"
            onScroll={(e) => {
              if (isInternalScroll.current) return
              const scrollLeft = e.currentTarget.scrollLeft
              const width = e.currentTarget.offsetWidth
              const index = Math.round(scrollLeft / width)
              if (index !== selectedImage) {
                setSelectedImage(index)
              }
            }}
          >
            {images.map((image, index) => (
              <div
                key={image.id || index}
                onClick={() => handleThumbnailClick((index + 1) % images.length)}
                className="flex-shrink-0 relative aspect-square w-full snap-center bg-white cursor-pointer"
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

          {/* Mobile Image Counter Badge (1 / N) */}
          {images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
              {selectedImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Mobile Indicator dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === selectedImage ? "bg-red-600 w-4" : "bg-gray-300"
                } z-10`}
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
                onClick={() => handleThumbnailClick(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedImage
                    ? "border-red-600"
                    : "border-gray-200"
                } z-10`}
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

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium z-50">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Main Content Container */}
          <div 
            className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Image */}
            <div className="relative w-full h-full max-h-[80vh] flex-1 min-h-0 mb-6">
              <Image
                src={images[lightboxIndex].url}
                alt={`Product image ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1536px) 90vw, 1400px"
                priority
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="w-full max-w-4xl overflow-x-auto no-scrollbar">
              <div className="flex gap-2 justify-center min-w-max px-4">
                {images.map((image, idx) => (
                  <button
                    key={image.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === lightboxIndex
                        ? "border-red-600 ring-2 ring-red-400"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain bg-white/10"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-50"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-50"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
