import React from "react"

import { IconProps } from "types/icon"

const Star = ({ color = "currentColor", size = "20", fill = "none", ...props }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 1L13 7L19 7.75L14.5 12L15.5 18L10 15.25L4.5 18L5.5 12L1 7.75L7 7L10 1Z"
        fill={fill === "none" ? "none" : fill}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Star
