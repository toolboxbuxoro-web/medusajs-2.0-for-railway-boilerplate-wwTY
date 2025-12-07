import React from "react"
import { IconProps } from "types/icon"

const Cart: React.FC<IconProps> = ({
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
      {...attributes}
    >
      <path
        d="M9 2L7 6m6-4l2 4M3 6h18l-2 12H5L3 6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="20" r="1" stroke={color} strokeWidth="2" />
      <circle cx="17" cy="20" r="1" stroke={color} strokeWidth="2" />
    </svg>
  )
}

export default Cart
