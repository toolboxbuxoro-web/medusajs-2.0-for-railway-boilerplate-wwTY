import React from "react"

const Click = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 40"
      height="40"
      width="120"
      className={className}
    >
      {/* Blue circle/rhombus mark */}
      <circle cx="16" cy="20" r="14" fill="#009FE3" />
      <circle cx="16" cy="20" r="8" fill="#009FE3" stroke="white" strokeWidth="3" />
      
      {/* "click" text in black */}
      <text
        x="38"
        y="28"
        fill="#1a1a1a"
        fontFamily="Arial, sans-serif"
        fontSize="22"
        fontWeight="600"
      >
        click
      </text>
    </svg>
  )
}

export default Click
