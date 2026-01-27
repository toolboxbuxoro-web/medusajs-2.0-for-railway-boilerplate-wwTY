import React from "react"

const Click = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 32"
      height="32"
      width="100"
      className={className}
      fill="none"
    >
      {/* Rhombus/Circle mark */}
      <path
        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 21c-3.866 0-7-3.134-7-7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7z"
        fill="#009FE3"
      />
      <path
        d="M16 11c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z"
        fill="#009FE3"
      />
      {/* "click" text - using paths for consistency and to avoid font issues */}
      <g fill="#1C1C1C">
        <path d="M43.5 13.5c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 3.5-1 4.2-2.5l-2.4-1.2c-0.4 0.7-1 1.2-1.8 1.2-1.2 0-2.1-1-2.1-2s0.9-2 2.1-2c0.8 0 1.4 0.5 1.8 1.2l2.4-1.2c-0.7-1.5-2.2-2.5-4.2-2.5z" />
        <path d="M51 9h2.5v13.5H51V9z" />
        <path d="M57.5 9h2.5v2.5h-2.5V9zm0 4.5h2.5v9h-2.5v-9z" />
        <path d="M69.5 13.5c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 3.5-1 4.2-2.5l-2.4-1.2c-0.4 0.7-1 1.2-1.8 1.2-1.2 0-2.1-1-2.1-2s0.9-2 2.1-2c0.8 0 1.4 0.5 1.8 1.2l2.4-1.2c-0.7-1.5-2.2-2.5-4.2-2.5z" />
        <path d="M78 9h2.5v7.5l5-4h3l-5.5 4.5 6 6h-3.5l-4.5-5V22.5H78V9z" />
      </g>
    </svg>
  )
}

export default Click
