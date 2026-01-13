"use client"

import { useState, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { useAuth } from "@lib/context/auth-context"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

export type OrdersState = "loading" | "empty" | "loaded" | "error"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export function useOrders() {
  const [state, setState] = useState<OrdersState>("loading")
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { authStatus } = useAuth()

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (authStatus !== "authorized") {
      setState("loading")
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setState("loading")
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/store/orders?limit=50`, {
        headers: {
          ...getMedusaHeaders(),
        },
        credentials: "include",
      })

      if (!resp.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await resp.json()
      const sortedOrders = [...(data.orders || [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setOrders(sortedOrders)

      if (sortedOrders.length === 0) {
        setState("empty")
      } else {
        setState("loaded")
      }
    } catch (error) {
      console.error("[useOrders] Error fetching orders:", error)
      setState("error")
    } finally {
      setRefreshing(false)
    }
  }, [authStatus])

  useEffect(() => {
    if (authStatus === "authorized") {
      fetchOrders()
    }
  }, [authStatus, fetchOrders])

  return {
    state,
    orders,
    refreshing,
    refresh: () => fetchOrders(true),
    retry: () => fetchOrders(false),
  }
}
