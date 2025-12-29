import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useState, useMemo } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  aspectRatio?: "3/4" | "9/16" | "11/14" | "1/1"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
  fit?: "cover" | "contain"
  /** Set to true for above-the-fold images (hero, first products) */
  priority?: boolean
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  aspectRatio = "3/4",
  isFeatured,
  className,
  "data-testid": dataTestid,
  fit = "cover",
  priority = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Use up to 6 images for the hover preview to keep it snappy
  const displayImages = useMemo(() => {
    const urls = images?.map((img) => img.url).filter(Boolean) || []
    const uniqueUrls = Array.from(new Set([thumbnail, ...urls])).filter(Boolean) as string[]
    return uniqueUrls.slice(0, 6)
  }, [thumbnail, images])

  const hasMultipleImages = displayImages.length > 1
  const initialImage = thumbnail || images?.[0]?.url

  // Determine aspect ratio: explicit prop takes priority, then size=square, then default
  const effectiveAspectRatio = size === "square" ? "1/1" : aspectRatio

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const sectionWidth = width / displayImages.length
    const index = Math.floor(x / sectionWidth)
    if (index !== activeIndex && index >= 0 && index < displayImages.length) {
      setActiveIndex(index)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setActiveIndex(0)
  }

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden bg-ui-bg-subtle rounded-large transition-shadow ease-in-out duration-150 group/thumbnail",
        className,
        {
          "aspect-[3/4]": effectiveAspectRatio === "3/4",
          "aspect-[9/16]": effectiveAspectRatio === "9/16",
          "aspect-[11/14]": effectiveAspectRatio === "11/14",
          "aspect-[1/1]": effectiveAspectRatio === "1/1",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {displayImages.length > 0 ? (
        <>
          {displayImages.map((src, idx) => (
            <Image
              key={src}
              src={src}
              alt={`Thumbnail ${idx + 1}`}
              className={clx("absolute inset-0 object-center transition-opacity duration-200", {
                "object-cover": fit === "cover",
                "object-contain": fit === "contain",
                "opacity-100 z-10": idx === (isHovered ? activeIndex : 0),
                "opacity-0 z-0": idx !== (isHovered ? activeIndex : 0),
              })}
              draggable={false}
              quality={idx === 0 ? 80 : 70}
              sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw"
              fill
              loading={priority && idx === 0 ? "eager" : "lazy"}
              priority={priority && idx === 0}
              data-testid="thumbnail-image"
            />
          ))}

          {/* Indicator segments - subtle bars at the bottom */}
          {hasMultipleImages && (
             <div 
              className={clx(
                "absolute bottom-2 left-2 right-2 flex gap-1 z-20 transition-opacity duration-300 pointer-events-none",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              {displayImages.map((_, idx) => (
                <div 
                  key={idx}
                  className={clx(
                    "h-1 flex-1 rounded-full transition-colors duration-200",
                    idx === activeIndex ? "bg-red-600 shadow-sm" : "bg-gray-300/60"
                  )}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full absolute inset-0 flex items-center justify-center">
          <PlaceholderImage size={size === "small" ? 16 : 24} />
        </div>
      )}
    </Container>
  )
}

export default Thumbnail

