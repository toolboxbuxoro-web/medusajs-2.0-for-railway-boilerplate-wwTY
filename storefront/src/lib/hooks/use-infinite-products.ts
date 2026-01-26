"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { HttpTypes } from "@medusajs/types"

export interface UseInfiniteProductsOptions {
  initialOffset?: number
  countryCode: string
  pageSize?: number
}

export interface UseInfiniteProductsReturn {
  products: HttpTypes.StoreProduct[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  refresh: () => void
  total: number
  loadMoreRef: (node?: Element | null) => void
}

const DEFAULT_PAGE_SIZE = 12

export function useInfiniteProducts({
  initialOffset = 0,
  countryCode,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseInfiniteProductsOptions): UseInfiniteProductsReturn {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(initialOffset)
  const [total, setTotal] = useState(0)

  const loadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Intersection Observer для infinite scroll
  // Используем rootMargin 300px для предзагрузки на слабых устройствах
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "300px",
  })

  // Функция загрузки товаров
  const fetchProducts = useCallback(
    async (currentOffset: number, isInitialLoad: boolean) => {
      if (loadingRef.current || !countryCode) {
        return
      }
      loadingRef.current = true

      // Отменяем предыдущий запрос если есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      if (isInitialLoad) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const params = new URLSearchParams({
          offset: currentOffset.toString(),
          limit: pageSize.toString(),
          countryCode,
        })

        const response = await fetch(`/api/products?${params}`, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const newProducts = (data.products || []) as HttpTypes.StoreProduct[]

        setProducts((prev) =>
          isInitialLoad ? newProducts : [...prev, ...newProducts]
        )
        setHasMore(data.hasMore || false)
        setTotal(data.total || 0)
        setOffset(data.nextOffset || currentOffset + pageSize)
      } catch (err: any) {
        if (err.name === "AbortError") {
          return // Игнорируем отмененные запросы
        }
        console.error("[useInfiniteProducts] Error:", err)
        setError(err.message || "Failed to fetch products")
        setHasMore(false)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
        loadingRef.current = false
      }
    },
    [countryCode, pageSize]
  )

  // Первоначальная загрузка
  useEffect(() => {
    setProducts([])
    setOffset(initialOffset)
    fetchProducts(initialOffset, true)
  }, [initialOffset, countryCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Автозагрузка при прокрутке
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore && !loadingRef.current) {
      // Небольшая задержка для предотвращения множественных запросов
      const timeoutId = setTimeout(() => {
        fetchProducts(offset, false)
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [inView, hasMore, isLoading, isLoadingMore, offset, fetchProducts])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || loadingRef.current) return
    fetchProducts(offset, false)
  }, [hasMore, isLoading, isLoadingMore, offset, fetchProducts])

  const refresh = useCallback(() => {
    setProducts([])
    setOffset(initialOffset)
    fetchProducts(initialOffset, true)
  }, [initialOffset, fetchProducts])

  return {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    total,
    loadMoreRef,
  }
}
