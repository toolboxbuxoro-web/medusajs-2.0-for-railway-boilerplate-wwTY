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
  const currentQueryRef = useRef<string>("") // Track current query to prevent race conditions
  const hydrationAbortRef = useRef<(() => void) | null>(null) // Track hydration to cancel if needed

  // Pre-fetch region for hydration
  useEffect(() => {
    getRegion(countryCode).then(region => {
      regionRef.current = region
    })
  }, [countryCode])

  const fetchData = useCallback(async (query: string, page: number, isNewSearch: boolean) => {
    // Cancel any pending hydration from previous query
    if (hydrationAbortRef.current) {
      hydrationAbortRef.current()
      hydrationAbortRef.current = null
    }

    // Update current query ref BEFORE checking loading state
    // This ensures new queries can always proceed even if previous is still loading
    const previousQuery = currentQueryRef.current
    const queryChanged = previousQuery !== query
    
    // If query changed, always allow new search (cancel previous)
    if (queryChanged && isNewSearch) {
      console.log(`[useInfiniteSearch] Query changed: "${previousQuery}" -> "${query}", resetting state`)
      // Force reset loading state for new query
      loadingRef.current = false
      // Cancel any pending operations (already done above, but ensure it's done)
      if (hydrationAbortRef.current) {
        hydrationAbortRef.current()
        hydrationAbortRef.current = null
      }
      // Immediately clear items to show loading state
      setState(prev => ({
        ...prev,
        items: [],
        status: "loading",
        query: query,
        page: 0,
        hasMore: true,
        totalHits: 0
      }))
    }
    
    // Only block if it's the same query and we're loading more pages
    if (loadingRef.current && !isNewSearch && !queryChanged) {
      return
    }
    
    // Update current query ref
    currentQueryRef.current = query
    loadingRef.current = true

    setState(prev => ({ 
      ...prev, 
      status: "loading",
      query: query,
      ...(isNewSearch && { items: [], page: 0, hasMore: true, totalHits: 0 })
    }))

    try {
      const offset = page * 24
      // Step 1: Get search results from Meilisearch (basic data)
      const results = await search(query, offset, countryCode, locale)

      // Check if query changed during fetch (race condition prevention)
      if (currentQueryRef.current !== query) {
        console.log("[useInfiniteSearch] Query changed during fetch, ignoring results")
        loadingRef.current = false // Reset loading when ignoring results
        return
      }

      const { hits = [], estimatedTotalHits = 0, mode = "search" } = results

      // Step 2: Show results immediately from Meilisearch (fast)
      // This allows users to see results right away
      setState(prev => {
        // Double check query hasn't changed
        if (prev.query !== query || currentQueryRef.current !== query) {
          return prev
        }

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
        const hydrationQuery = query // Capture query for this hydration
        let isCancelled = false

        // Set up cancellation function
        hydrationAbortRef.current = () => {
          isCancelled = true
        }

        // Don't await - let it run in background
        getRegion(countryCode).then(region => {
          if (!region || isCancelled || currentQueryRef.current !== hydrationQuery) {
            return
          }
          
          const productIds = hits.map((h: any) => h.id)
          
          // Hydrate in background without blocking
          getProductsById({
            ids: productIds,
            regionId: region.id
          })
            .then((fullProducts) => {
              // Check if hydration is still valid (query hasn't changed)
              if (isCancelled || currentQueryRef.current !== hydrationQuery) {
                console.log("[useInfiniteSearch] Hydration cancelled or query changed")
                return
              }

              // Update items with hydrated data when ready
              setState(prev => {
                // Only update if query hasn't changed
                if (prev.query !== hydrationQuery || currentQueryRef.current !== hydrationQuery) {
                  return prev
                }
                
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
              if (!isCancelled && currentQueryRef.current === hydrationQuery) {
                console.warn("[useInfiniteSearch] Background hydration failed, using Meilisearch data:", e)
              }
              // Continue with Meilisearch data - no UI impact
            })
            .finally(() => {
              if (hydrationAbortRef.current && currentQueryRef.current === hydrationQuery) {
                hydrationAbortRef.current = null
              }
            })
        }).catch(() => {
          // Region fetch failed - continue with Meilisearch data
        })
      }
    } catch (error) {
      // Only update state if query hasn't changed
      if (currentQueryRef.current === query) {
        console.error("[useInfiniteSearch] Error:", error)
        setState(prev => {
          if (prev.query !== query) return prev
          return { ...prev, status: "error", hasMore: false }
        })
      } else {
        // Query changed during error, ensure loading is reset
        console.log("[useInfiniteSearch] Query changed during error, resetting loading")
      }
    } finally {
      // Always reset loading - if query changed, new query will handle it
      // But we need to reset to allow new queries to proceed
      if (currentQueryRef.current === query) {
        loadingRef.current = false
      } else {
        // Query changed, ensure loading is reset for new query
        loadingRef.current = false
      }
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
