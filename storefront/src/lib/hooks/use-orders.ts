"use client"

import { useState, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { useAuth } from "@lib/context/auth-context"
import { listOrders } from "@lib/data/orders"

export type OrdersState = "loading" | "empty" | "loaded" | "error"

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
      // Use server action which properly handles auth headers via cookies
      const ordersData = await listOrders(50, 0)
      
      if (!ordersData || !Array.isArray(ordersData)) {
        setState("empty")
        setOrders([])
        return
      }

      const sortedOrders = [...ordersData].sort(
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
