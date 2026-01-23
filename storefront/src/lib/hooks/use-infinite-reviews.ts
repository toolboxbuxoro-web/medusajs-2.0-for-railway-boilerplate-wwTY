"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useInView } from "react-intersection-observer"
import { getReviews } from "@lib/data/review.service"
import { Review } from "@lib/data/review.types"

export type SortOption = "newest" | "oldest" | "rating_desc" | "rating_asc"

export interface ReviewFilters {
  rating?: number
  withPhotos?: boolean
}

export interface UseInfiniteReviewsOptions {
  productId: string
  initialFilters?: ReviewFilters
  initialSort?: SortOption
  pageSize?: number
}

export interface UseInfiniteReviewsReturn {
  reviews: Review[]
  total: number
  averageRating: number
  distribution: Record<number, number>
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMore: () => void
  setFilters: (filters: ReviewFilters) => void
  setSort: (sort: SortOption) => void
  refresh: () => void
  filters: ReviewFilters
  sort: SortOption
  loadMoreRef: (node?: Element | null) => void
}

const DEFAULT_PAGE_SIZE = 10

export function useInfiniteReviews({
  productId,
  initialFilters = {},
  initialSort = "newest",
  pageSize = DEFAULT_PAGE_SIZE,
}: UseInfiniteReviewsOptions): UseInfiniteReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ReviewFilters>(initialFilters)
  const [sort, setSortState] = useState<SortOption>(initialSort)
  const [page, setPage] = useState(0)

  const loadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Intersection Observer для infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "200px", // Начинаем загрузку за 200px до конца
  })

  // Функция загрузки отзывов
  const fetchReviews = useCallback(
    async (currentPage: number, isNewSearch: boolean) => {
      if (loadingRef.current) return
      loadingRef.current = true

      // Отменяем предыдущий запрос если есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      if (isNewSearch) {
        setIsLoading(true)
        setPage(0)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const offset = currentPage * pageSize
        const sortParam = sort === "newest" ? "newest" : sort === "oldest" ? "newest" : sort

        // Загружаем отзывы
        const data = await getReviews(productId, {
          limit: pageSize,
          offset,
          sort: sortParam,
        })

        // Фильтруем на клиенте (если backend не поддерживает фильтры)
        let filteredReviews = Array.isArray(data.reviews) ? data.reviews : []

        if (filters.rating) {
          filteredReviews = filteredReviews.filter((r) => r.rating === filters.rating)
        }

        if (filters.withPhotos) {
          filteredReviews = filteredReviews.filter(
            (r) => Array.isArray(r.images) && r.images.length > 0
          )
        }

        // Сортируем на клиенте если нужно
        if (sort === "oldest") {
          filteredReviews = [...filteredReviews].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        } else if (sort === "rating_desc") {
          filteredReviews = [...filteredReviews].sort((a, b) => b.rating - a.rating)
        } else if (sort === "rating_asc") {
          filteredReviews = [...filteredReviews].sort((a, b) => a.rating - b.rating)
        }

        setReviews((prev) => (isNewSearch ? filteredReviews : [...prev, ...filteredReviews]))
        setTotal(data.total || 0)
        setAverageRating(data.average_rating || 0)
        setDistribution(data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
        setHasMore(filteredReviews.length === pageSize && (currentPage + 1) * pageSize < (data.total || 0))
        setPage(currentPage)
      } catch (err: any) {
        if (err.name === "AbortError") {
          return // Игнорируем отмененные запросы
        }
        console.error("[useInfiniteReviews] Error:", err)
        setError(err.message || "Failed to fetch reviews")
        setHasMore(false)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
        loadingRef.current = false
      }
    },
    [productId, pageSize, sort, filters]
  )

  // Первоначальная загрузка и при изменении фильтров/сортировки
  useEffect(() => {
    setReviews([])
    setPage(0)
    fetchReviews(0, true)
  }, [productId, filters.rating, filters.withPhotos, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  // Автозагрузка при прокрутке
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      fetchReviews(page + 1, false)
    }
  }, [inView, hasMore, isLoading, isLoadingMore, page, fetchReviews])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return
    fetchReviews(page + 1, false)
  }, [hasMore, isLoading, isLoadingMore, page, fetchReviews])

  const setFilters = useCallback((newFilters: ReviewFilters) => {
    setFiltersState(newFilters)
  }, [])

  const setSort = useCallback((newSort: SortOption) => {
    setSortState(newSort)
  }, [])

  const refresh = useCallback(() => {
    setReviews([])
    setPage(0)
    fetchReviews(0, true)
  }, [fetchReviews])

  return {
    reviews,
    total,
    averageRating,
    distribution,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    setFilters,
    setSort,
    refresh,
    filters,
    sort,
    loadMoreRef,
  }
}
