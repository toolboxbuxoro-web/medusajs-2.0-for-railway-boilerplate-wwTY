import React from "react"

const Click = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 24"
      height="24"
      width="60"
      className={className}
    >
      {/* Click logo - blue background with white text */}
      <rect width="60" height="24" rx="3" fill="#009FE3" />
      <text
        x="30"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="700"
        letterSpacing="0.5"
      >
        CLICK
      </text>
    </svg>
  )
}

export default Click
