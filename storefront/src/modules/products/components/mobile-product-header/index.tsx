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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
