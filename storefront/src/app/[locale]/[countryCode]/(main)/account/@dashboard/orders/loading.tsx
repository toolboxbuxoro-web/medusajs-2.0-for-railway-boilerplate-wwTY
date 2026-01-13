import SkeletonOrderCard from "@modules/account/components/order-overview/skeleton-order-card"
import React from "react"

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-y-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonOrderCard key={i} />
      ))}
    </div>
  )
}
