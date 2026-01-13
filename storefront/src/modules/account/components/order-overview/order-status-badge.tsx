"use client"

import React from "react"
import { useParams } from "next/navigation"
import { getOrderStatus } from "@lib/util/order-status"
import { HttpTypes } from "@medusajs/types"

type OrderStatusBadgeProps = {
  order: HttpTypes.StoreOrder
}

const OrderStatusBadge = ({ order }: OrderStatusBadgeProps) => {
  const { locale } = useParams()
  const { label, color, bgColor } = getOrderStatus(order, (locale as any) || 'ru')

  return (
    <div 
      className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-extrabold uppercase whitespace-nowrap tracking-wider leading-none"
      style={{ 
        backgroundColor: bgColor,
        color: color,
        minHeight: '24px'
      }}
    >
      {label}
    </div>
  )
}

export default OrderStatusBadge

