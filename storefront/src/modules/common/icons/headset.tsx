import React from "react"

import { IconProps } from "types/icon"

const Headset: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...attributes}
    >
      <path d="M3 13V11a9 9 0 0 1 18 0v2" />
      <circle cx="18" cy="17" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="M21 17v2a3 3 0 0 1-3 3h-2" />
      <path d="M3 17v2a3 3 0 0 0 3 3h2" />
    </svg>
  )
}

export default Headset
