"use client"

import { useState, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { useAuth } from "@lib/context/auth-context"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

export type OrderState = "loading" | "loaded" | "error"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export function useOrder(id: string) {
  const [state, setState] = useState<OrderState>("loading")
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const { authStatus } = useAuth()

  const fetchOrder = useCallback(async () => {
    if (!id || authStatus !== "authorized") {
      return
    }

    setState("loading")
    try {
      const resp = await fetch(`${BACKEND_URL}/store/orders/${id}?fields=*items,+items.thumbnail,+shipping_address`, {
        headers: {
          ...getMedusaHeaders(),
        },
        credentials: "include",
      })

      if (!resp.ok) {
        throw new Error("Failed to fetch order")
      }

      const data = await resp.json()
      setOrder(data.order)
      setState("loaded")
    } catch (error) {
      console.error("[useOrder] Error fetching order:", error)
      setState("error")
    }
  }, [id, authStatus])

  useEffect(() => {
    if (authStatus === "authorized" && id) {
      fetchOrder()
    }
  }, [id, authStatus, fetchOrder])

  return {
    state,
    order,
    retry: fetchOrder,
  }
}
