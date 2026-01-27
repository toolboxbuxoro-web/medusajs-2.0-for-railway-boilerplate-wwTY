import React from "react"

const Payme = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 40"
      height="40"
      width="140"
      className={className}
    >
      {/* "Pay" text in black */}
      <text
        x="2"
        y="28"
        fill="#1a1a1a"
        fontFamily="Arial, sans-serif"
        fontSize="26"
        fontWeight="700"
      >
        Pay
      </text>
      
      {/* Teal rounded tag shape */}
      <rect
        x="48"
        y="8"
        width="75"
        height="24"
        rx="12"
        fill="#00CDCD"
      />
      
      {/* "me" text in white */}
      <text
        x="64"
        y="27"
        fill="white"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight="700"
      >
        me
      </text>
    </svg>
  )
}

export default Payme
