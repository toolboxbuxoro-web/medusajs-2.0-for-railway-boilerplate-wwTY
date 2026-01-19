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

export function useInfiniteSearch(initialQuery: string = "", countryCode: string = "uz") {
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
      const results = await search(query, offset, countryCode)

      const { hits = [], estimatedTotalHits = 0, mode = "search" } = results

      // Step 2: Hydrate with full product data including prices
      let hydratedHits = hits
      
      if (hits.length > 0 && regionRef.current) {
        try {
          const productIds = hits.map((h: any) => h.id)
          const fullProducts = await getProductsById({
            ids: productIds,
            regionId: regionRef.current.id
          })
          
          // Map back to preserve Meilisearch order
          hydratedHits = productIds.map((id: string) => {
            const fullProduct = fullProducts.find((p: any) => p.id === id)
            const meilisearchHit = hits.find((h: any) => h.id === id)
            
            if (fullProduct) {
              return {
                ...fullProduct,
                _formatted: meilisearchHit?._formatted, // Keep highlighting
              }
            }
            // Fallback to Meilisearch data if not found
            return meilisearchHit
          }).filter(Boolean)
        } catch (e) {
          console.warn("[useInfiniteSearch] Hydration failed, using raw hits:", e)
          // Continue with raw Meilisearch hits
        }
      }

      setState(prev => {
        if (prev.query !== query && isNewSearch) return prev

        const newItems = isNewSearch ? hydratedHits : [...prev.items, ...hydratedHits]
        const hasMore = hydratedHits.length > 0 && newItems.length < estimatedTotalHits

        return {
          ...prev,
          items: newItems,
          status: "success",
          mode: mode as SearchMode,
          totalHits: estimatedTotalHits,
          hasMore,
          page: page,
        }
      })
    } catch (error) {
      console.error("[useInfiniteSearch] Error:", error)
      setState(prev => ({ ...prev, status: "error", hasMore: false }))
    } finally {
      loadingRef.current = false
    }
  }, [countryCode])

  // Initial fetch / Query change fetch
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(state.query, 0, true)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.query, fetchData])

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
