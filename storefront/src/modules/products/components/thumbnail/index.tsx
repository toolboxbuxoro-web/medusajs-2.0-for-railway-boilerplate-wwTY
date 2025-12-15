import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

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
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  // Determine aspect ratio: explicit prop takes priority, then size=square, then default
  const effectiveAspectRatio = size === "square" ? "1/1" : aspectRatio

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden bg-ui-bg-subtle rounded-large transition-shadow ease-in-out duration-150",
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
    >
      <ImageOrPlaceholder image={initialImage} size={size} fit={fit} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  fit = "cover",
}: Pick<ThumbnailProps, "size"> & { image?: string; fit?: "cover" | "contain" }) => {
  return image ? (
    <Image
      src={image}
      alt="Thumbnail"
      className={clx("absolute inset-0 object-center", {
        "object-cover": fit === "cover",
        "object-contain": fit === "contain",
      })}
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
      data-testid="thumbnail-image"
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
