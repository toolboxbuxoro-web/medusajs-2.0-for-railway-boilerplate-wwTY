"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import FavoriteButton from "@modules/products/components/favorite-button"
import { getLocalizedField } from "@lib/util/localization"

type MobileProductHeaderProps = {
  product: HttpTypes.StoreProduct
}

const MobileProductHeader: React.FC<MobileProductHeaderProps> = ({ product }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  
  const productTitle = getLocalizedField(product, "title", localeStr) || product.title

  const [galleryHeight, setGalleryHeight] = useState(400) // Default fallback

  useEffect(() => {
    // Get gallery height on mount
    const updateGalleryHeight = () => {
      const gallery = document.querySelector('[data-testid="image-gallery"]')
      if (gallery) {
        setGalleryHeight(gallery.clientHeight)
      }
    }

    // Wait a bit for images to load
    const timer = setTimeout(updateGalleryHeight, 500)
    
    // Also update on resize
    window.addEventListener('resize', updateGalleryHeight)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateGalleryHeight)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      // Header becomes solid when scrolled past the gallery
      setIsScrolled(window.scrollY > galleryHeight - 56) // 56px = header height
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [galleryHeight])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Ссылка скопирована в буфер обмена")
    }
  }

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-300 w-full h-14 flex items-center px-4 ${
        isScrolled 
          ? "bg-white border-b border-gray-100 shadow-sm opacity-100" 
          : "bg-transparent opacity-100"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left: Back Button */}
        <button 
          onClick={() => router.back()}
          className={`p-2 rounded-full transition-colors flex items-center justify-center ${
            isScrolled ? "text-gray-900" : "text-gray-900 bg-white/50 backdrop-blur-sm shadow-sm"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Center: Title (Visible on scroll) */}
        <div 
          className={`flex-1 mx-4 transition-all duration-300 text-center ${
            isScrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <span className="text-sm font-bold text-gray-900 line-clamp-1">
            {productTitle}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <div className={`p-2 rounded-full transition-colors flex items-center justify-center ${
            isScrolled ? "" : "bg-white/50 backdrop-blur-sm shadow-sm"
          }`}>
             {/* The current FavoriteButton component has internal labels we might want to hide but it's okay for now since we have icons */}
             <FavoriteButton productId={product.id} />
          </div>
          
          {/* Phone Call Button */}
          <a
            href="tel:+998712000909"
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              isScrolled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-green-500/90 hover:bg-green-600 text-white backdrop-blur-sm shadow-sm"
            }`}
            aria-label="Позвонить"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </a>
          
          <button 
            onClick={handleShare}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${
              isScrolled ? "text-gray-900" : "text-gray-900 bg-white/50 backdrop-blur-sm shadow-sm"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileProductHeader
