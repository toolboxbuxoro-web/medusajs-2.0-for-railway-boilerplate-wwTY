"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { HttpTypes } from "@medusajs/types"

export interface CollectionWithProducts extends HttpTypes.StoreCollection {
  products: HttpTypes.StoreProduct[]
}

export interface UseInfiniteCollectionsOptions {
  initialOffset: number
  countryCode: string
  pageSize?: number
}

export interface UseInfiniteCollectionsReturn {
  collections: CollectionWithProducts[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  refresh: () => void
  total: number
  loadMoreRef: (node?: Element | null) => void
}

const DEFAULT_PAGE_SIZE = 4

export function useInfiniteCollections({
  initialOffset,
  countryCode,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseInfiniteCollectionsOptions): UseInfiniteCollectionsReturn {
  const [collections, setCollections] = useState<CollectionWithProducts[]>([])
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

  // Функция загрузки коллекций
  const fetchCollections = useCallback(
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

        const response = await fetch(`/api/collections?${params}`, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const newCollections = (data.collections || []) as CollectionWithProducts[]

        setCollections((prev) =>
          isInitialLoad ? newCollections : [...prev, ...newCollections]
        )
        setHasMore(data.hasMore || false)
        setTotal(data.total || 0)
        setOffset(data.nextOffset || currentOffset + pageSize)
      } catch (err: any) {
        if (err.name === "AbortError") {
          return // Игнорируем отмененные запросы
        }
        console.error("[useInfiniteCollections] Error:", err)
        setError(err.message || "Failed to fetch collections")
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
    setCollections([])
    setOffset(initialOffset)
    fetchCollections(initialOffset, true)
  }, [initialOffset, countryCode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Автозагрузка при прокрутке
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore && !loadingRef.current) {
      // Небольшая задержка для предотвращения множественных запросов
      const timeoutId = setTimeout(() => {
        fetchCollections(offset, false)
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [inView, hasMore, isLoading, isLoadingMore, offset, fetchCollections])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || loadingRef.current) return
    fetchCollections(offset, false)
  }, [hasMore, isLoading, isLoadingMore, offset, fetchCollections])

  const refresh = useCallback(() => {
    setCollections([])
    setOffset(initialOffset)
    fetchCollections(initialOffset, true)
  }, [initialOffset, fetchCollections])

  return {
    collections,
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
