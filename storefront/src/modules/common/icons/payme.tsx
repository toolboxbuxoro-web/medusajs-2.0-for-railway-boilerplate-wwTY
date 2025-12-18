import React from "react"

const Payme = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 70 24"
      height="24"
      width="70"
      className={className}
    >
      {/* Payme logo - teal/cyan background with white text */}
      <rect width="70" height="24" rx="3" fill="#00CDCD" />
      <text
        x="35"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.5"
      >
        payme
      </text>
    </svg>
  )
}

export default Payme
