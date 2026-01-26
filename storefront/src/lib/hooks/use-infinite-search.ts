"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { search } from "@modules/search/actions"
import { getProductsById } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

export type SearchMode = "search" | "recommendation" | "fallback"
export type SearchStatus = "idle" | "loading" | "success" | "error"

export interface InfiniteSearchState {
  items: any[]
  query: string
  page: number
  hasMore: boolean
  status: SearchStatus
  mode: SearchMode
  totalHits: number
}

export function useInfiniteSearch(initialQuery: string = "", countryCode: string = "uz", locale: string = "ru") {
  const [state, setState] = useState<InfiniteSearchState>({
    items: [],
    query: initialQuery,
    page: 0,
    hasMore: true,
    status: "idle",
    mode: "recommendation",
    totalHits: 0,
  })

  const loadingRef = useRef(false)
  const regionRef = useRef<any>(null)

  // Pre-fetch region for hydration
  useEffect(() => {
    getRegion(countryCode).then(region => {
      regionRef.current = region
    })
  }, [countryCode])

  const fetchData = useCallback(async (query: string, page: number, isNewSearch: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true

    setState(prev => ({ 
      ...prev, 
      status: "loading",
      query: query,
      ...(isNewSearch && { items: [], page: 0, hasMore: true })
    }))

    try {
      const offset = page * 24
      // Step 1: Get search results from Meilisearch (basic data)
      const results = await search(query, offset, countryCode, locale)

      const { hits = [], estimatedTotalHits = 0, mode = "search" } = results

      // Step 2: Show results immediately from Meilisearch (fast)
      // This allows users to see results right away
      setState(prev => {
        if (prev.query !== query && isNewSearch) return prev

        const newItems = isNewSearch ? hits : [...prev.items, ...hits]
        const hasMore = hits.length > 0 && newItems.length < estimatedTotalHits

        return {
          ...prev,
          items: newItems,
          status: "success", // Show results immediately
          mode: mode as SearchMode,
          totalHits: estimatedTotalHits,
          hasMore,
          page: page,
        }
      })

      // Step 3: Hydrate with full product data asynchronously (in background)
      // This doesn't block the UI - users see results immediately
      if (hits.length > 0 && regionRef.current) {
        // Don't await - let it run in background
        getRegion(countryCode).then(region => {
          if (!region) return
          
          const productIds = hits.map((h: any) => h.id)
          
          // Hydrate in background without blocking
          getProductsById({
            ids: productIds,
            regionId: region.id
          })
            .then((fullProducts) => {
              // Update items with hydrated data when ready
              setState(prev => {
                // Only update if query hasn't changed
                if (prev.query !== query) return prev
                
                const hydratedItems = prev.items.map((item: any) => {
                  const fullProduct = fullProducts.find((p: any) => p.id === item.id)
                  if (fullProduct) {
                    return {
                      ...fullProduct,
                      _formatted: item._formatted, // Keep highlighting
                    }
                  }
                  return item
                })
                
                return {
                  ...prev,
                  items: hydratedItems
                }
              })
            })
            .catch((e) => {
              console.warn("[useInfiniteSearch] Background hydration failed, using Meilisearch data:", e)
              // Continue with Meilisearch data - no UI impact
            })
        }).catch(() => {
          // Region fetch failed - continue with Meilisearch data
        })
      }
    } catch (error) {
      console.error("[useInfiniteSearch] Error:", error)
      setState(prev => ({ ...prev, status: "error", hasMore: false }))
    } finally {
      loadingRef.current = false
    }
  }, [countryCode, locale])

  // Initial fetch / Query change fetch
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(state.query, 0, true)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.query, fetchData, locale])

  const loadMore = useCallback(() => {
    if (state.status === "loading" || !state.hasMore) return
    if (state.items.length === 0 && state.status === "idle") return 

    fetchData(state.query, state.page + 1, false)
  }, [state.query, state.page, state.status, state.hasMore, state.items.length, fetchData])

  const setQuery = useCallback((newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }))
  }, [])

  return {
    ...state,
    setQuery,
    loadMore,
  }
}
