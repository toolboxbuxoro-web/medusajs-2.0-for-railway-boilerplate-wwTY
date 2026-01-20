import { HttpTypes } from "@medusajs/types"

export interface OrderStatusInfo {
  label: string
  color: string
  bgColor: string
  // icon: 'time-outline' | 'sync-outline' | 'checkmark-circle-outline' | 'close-circle-outline' | 'cube-outline';
}

/**
 * Maps Medusa order statuses to human-readable UX statuses.
 * Identical to Mobile P0 implementation.
 * 
 * @param order - The order object
 * @param locale - The locale for label text ('ru' or 'uz')
 * @returns StatusInfo object with label and colors
 */
export function getOrderStatus(order: HttpTypes.StoreOrder, locale: 'ru' | 'uz' = 'ru'): OrderStatusInfo {
  let status = (order as any).status?.toLowerCase() || 'pending'

  // Derive status from fulfillments if available
  const fulfillments = (order as any).fulfillments || []
  if (fulfillments.length > 0) {
    const latest = fulfillments[fulfillments.length - 1]
    if (latest.shipped_at) {
      status = 'shipped'
    } else if (latest.created_at) {
      // If fulfillment exists but not shipped -> Ready for pickup
      status = 'fulfilled' 
    }
  }
  
  // Check if delivered (from metadata)
  if ((order.metadata as any)?.delivered_at) {
    status = 'delivered'
  }

  const labels: Record<string, { ru: string; uz: string }> = {
    pending: { ru: 'Принят', uz: 'Qabul qilindi' },
    processing: { ru: 'В обработке', uz: 'Jarayonda' },
    fulfilled: { ru: 'Готов к получению', uz: 'Olib ketishga tayyor' },
    shipped: { ru: 'В пути', uz: 'Yo\'lda' },
    delivered: { ru: 'Доставлен', uz: 'Yetkazib berildi' },
    completed: { ru: 'Завершён', uz: 'Yakunlandi' },
    canceled: { ru: 'Отменён', uz: 'Bekor qilindi' },
  }

  // Uzum-style soft, non-acidic colors (Tailwind-like hex values)
  const statusMap: Record<string, Omit<OrderStatusInfo, 'label'>> = {
    pending: { 
      color: '#92400E', // Warm amber text
      bgColor: '#FEF3C7', // Soft amber bg
    },
    processing: { 
      color: '#1E40AF', // Deep blue text
      bgColor: '#DBEAFE', // Soft blue bg
    },
    fulfilled: { 
      color: '#065F46', // Deep green text
      bgColor: '#D1FAE5', // Soft green bg
    },
    shipped: {
      color: '#5B21B6', // Deep purple text
      bgColor: '#EDE9FE', // Soft purple bg
    },
    delivered: {
      color: '#065F46', // Deep green text
      bgColor: '#D1FAE5', // Soft green bg
    },
    completed: { 
      color: '#374151', // Neutral gray text
      bgColor: '#F3F4F6', // Light gray bg
    },
    canceled: { 
      color: '#991B1B', // Deep red text
      bgColor: '#FEE2E2', // Soft red bg
    },
  }

  const info = statusMap[status] || statusMap.pending
  const label = labels[status]?.[locale] || labels.pending[locale]

  return { ...info, label }
}

/**
 * Returns only color info for the status
 */
export function getOrderStatusColor(order: HttpTypes.StoreOrder) {
  const info = getOrderStatus(order)
  return {
    color: info.color,
    bgColor: info.bgColor
  }
}

