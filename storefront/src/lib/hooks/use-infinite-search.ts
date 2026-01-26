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
  const currentQueryRef = useRef<string>(initialQuery) // Initialize with initialQuery
  const hydrationAbortRef = useRef<(() => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null) // For cancelling fetch requests
  const requestIdRef = useRef<number>(0) // Track request IDs for race condition prevention

  // Initialize currentQueryRef with initialQuery on mount
  useEffect(() => {
    currentQueryRef.current = initialQuery
    console.log(`[useInfiniteSearch] Initialized with query: "${initialQuery}"`)
  }, []) // Only on mount

  // Sync currentQueryRef when initialQuery changes externally
  useEffect(() => {
    if (initialQuery !== currentQueryRef.current) {
      console.log(`[useInfiniteSearch] initialQuery changed externally: "${currentQueryRef.current}" -> "${initialQuery}"`)
      currentQueryRef.current = initialQuery
    }
  }, [initialQuery])

  // Pre-fetch region for hydration
  useEffect(() => {
    getRegion(countryCode).then(region => {
      regionRef.current = region
    })
  }, [countryCode])

  const fetchData = useCallback(async (query: string, page: number, isNewSearch: boolean) => {
    // Generate unique request ID for this fetch
    const requestId = ++requestIdRef.current
    const thisRequestId = requestId
    
    console.log(`[useInfiniteSearch] fetchData called: query="${query}", page=${page}, isNewSearch=${isNewSearch}, requestId=${requestId}`)

    // Cancel any pending operations from previous query
    if (abortControllerRef.current) {
      console.log(`[useInfiniteSearch] Aborting previous request (requestId=${requestId - 1})`)
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (hydrationAbortRef.current) {
      hydrationAbortRef.current()
      hydrationAbortRef.current = null
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Update current query ref BEFORE checking loading state
    const previousQuery = currentQueryRef.current
    const queryChanged = previousQuery !== query
    
    console.log(`[useInfiniteSearch] Previous query: "${previousQuery}", New query: "${query}", Changed: ${queryChanged}`)
    
    // If query changed, always allow new search (cancel previous)
    if (queryChanged && isNewSearch) {
      console.log(`[useInfiniteSearch] Query changed: "${previousQuery}" -> "${query}", resetting state`)
      loadingRef.current = false
    }
    
    // Only block if it's the same query and we're loading more pages
    if (loadingRef.current && !isNewSearch && !queryChanged) {
      console.log(`[useInfiniteSearch] Blocked: same query loading more pages`)
      return
    }
    
    // Update current query ref and set loading
    currentQueryRef.current = query
    loadingRef.current = true

    // Set loading state (only once, no duplication)
    setState(prev => {
      // Check if this update is still relevant
      if (requestIdRef.current !== thisRequestId) {
        console.log(`[useInfiniteSearch] State update skipped: requestId mismatch (${requestIdRef.current} !== ${thisRequestId})`)
        return prev
      }
      
      return { 
        ...prev, 
        status: "loading",
        query: query,
        ...(isNewSearch && { items: [], page: 0, hasMore: true, totalHits: 0 })
      }
    })

    try {
      const offset = page * 24
      console.log(`[useInfiniteSearch] Fetching search results: query="${query}", offset=${offset}, requestId=${thisRequestId}`)
      
      // Step 1: Get search results from Meilisearch (basic data)
      const results = await search(query, offset, countryCode, locale)

      // Check if request is still valid (race condition prevention)
      if (requestIdRef.current !== thisRequestId) {
        console.log(`[useInfiniteSearch] Request outdated: current=${requestIdRef.current}, this=${thisRequestId}, ignoring results`)
        return
      }

      if (currentQueryRef.current !== query) {
        console.log(`[useInfiniteSearch] Query changed during fetch: "${currentQueryRef.current}" !== "${query}", ignoring results`)
        loadingRef.current = false
        return
      }

      const { hits = [], estimatedTotalHits = 0, mode = "search" } = results
      console.log(`[useInfiniteSearch] Search results received: hits=${hits.length}, total=${estimatedTotalHits}, mode=${mode}, requestId=${thisRequestId}`)

      // Step 2: Show results immediately from Meilisearch (fast)
      // This allows users to see results right away
      setState(prev => {
        // Triple check: requestId, query ref, and state query
        if (requestIdRef.current !== thisRequestId) {
          console.log(`[useInfiniteSearch] State update skipped (requestId): current=${requestIdRef.current}, this=${thisRequestId}`)
          return prev
        }
        
        if (currentQueryRef.current !== query) {
          console.log(`[useInfiniteSearch] State update skipped (query ref): "${currentQueryRef.current}" !== "${query}"`)
          return prev
        }
        
        if (prev.query !== query) {
          console.log(`[useInfiniteSearch] State update skipped (state query): "${prev.query}" !== "${query}"`)
          return prev
        }

        const newItems = isNewSearch ? hits : [...prev.items, ...hits]
        const hasMore = hits.length > 0 && newItems.length < estimatedTotalHits

        console.log(`[useInfiniteSearch] Updating state: items=${newItems.length}, hasMore=${hasMore}, requestId=${thisRequestId}`)

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
        const hydrationRequestId = thisRequestId // Capture requestId for this hydration
        let isCancelled = false

        // Set up cancellation function
        hydrationAbortRef.current = () => {
          console.log(`[useInfiniteSearch] Hydration cancelled for requestId=${hydrationRequestId}`)
          isCancelled = true
        }

        // Don't await - let it run in background
        getRegion(countryCode).then(region => {
          // Check if hydration is still valid
          if (!region || isCancelled || requestIdRef.current !== hydrationRequestId || currentQueryRef.current !== hydrationQuery) {
            console.log(`[useInfiniteSearch] Hydration skipped: cancelled=${isCancelled}, requestId=${requestIdRef.current} !== ${hydrationRequestId}, query="${currentQueryRef.current}" !== "${hydrationQuery}"`)
            return
          }
          
          const productIds = hits.map((h: any) => h.id)
          console.log(`[useInfiniteSearch] Starting hydration: ${productIds.length} products, requestId=${hydrationRequestId}`)
          
          // Hydrate in background without blocking
          getProductsById({
            ids: productIds,
            regionId: region.id
          })
            .then((fullProducts) => {
              // Check if hydration is still valid (query hasn't changed)
              if (isCancelled || requestIdRef.current !== hydrationRequestId || currentQueryRef.current !== hydrationQuery) {
                console.log(`[useInfiniteSearch] Hydration cancelled or outdated: cancelled=${isCancelled}, requestId=${requestIdRef.current} !== ${hydrationRequestId}, query="${currentQueryRef.current}" !== "${hydrationQuery}"`)
                return
              }

              console.log(`[useInfiniteSearch] Hydration complete: ${fullProducts.length} products hydrated, requestId=${hydrationRequestId}`)

              // Update items with hydrated data when ready
              setState(prev => {
                // Only update if everything is still valid
                if (requestIdRef.current !== hydrationRequestId) {
                  console.log(`[useInfiniteSearch] Hydration state update skipped (requestId): ${requestIdRef.current} !== ${hydrationRequestId}`)
                  return prev
                }
                
                if (prev.query !== hydrationQuery || currentQueryRef.current !== hydrationQuery) {
                  console.log(`[useInfiniteSearch] Hydration state update skipped (query): "${prev.query}" !== "${hydrationQuery}" or "${currentQueryRef.current}" !== "${hydrationQuery}"`)
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
                
                console.log(`[useInfiniteSearch] State updated with hydrated items: ${hydratedItems.length}, requestId=${hydrationRequestId}`)
                
                return {
                  ...prev,
                  items: hydratedItems
                }
              })
            })
            .catch((e) => {
              if (!isCancelled && requestIdRef.current === hydrationRequestId && currentQueryRef.current === hydrationQuery) {
                console.warn(`[useInfiniteSearch] Background hydration failed for requestId=${hydrationRequestId}:`, e)
              }
              // Continue with Meilisearch data - no UI impact
            })
            .finally(() => {
              if (hydrationAbortRef.current && requestIdRef.current === hydrationRequestId && currentQueryRef.current === hydrationQuery) {
                hydrationAbortRef.current = null
              }
            })
        }).catch(() => {
          // Region fetch failed - continue with Meilisearch data
        })
      }
    } catch (error) {
      // Check if this error is still relevant
      if (requestIdRef.current !== thisRequestId) {
        console.log(`[useInfiniteSearch] Error ignored: request outdated (current=${requestIdRef.current}, this=${thisRequestId})`)
        return
      }
      
      // Only update state if query hasn't changed
      if (currentQueryRef.current === query) {
        console.error(`[useInfiniteSearch] Error for requestId=${thisRequestId}:`, error)
        setState(prev => {
          if (requestIdRef.current !== thisRequestId || prev.query !== query) {
            return prev
          }
          return { ...prev, status: "error", hasMore: false }
        })
      } else {
        console.log(`[useInfiniteSearch] Query changed during error: "${currentQueryRef.current}" !== "${query}", requestId=${thisRequestId}`)
      }
    } finally {
      // Only reset loading if this is still the current request
      if (requestIdRef.current === thisRequestId) {
        console.log(`[useInfiniteSearch] Resetting loading for requestId=${thisRequestId}`)
        loadingRef.current = false
        abortControllerRef.current = null
      } else {
        console.log(`[useInfiniteSearch] Finally block skipped: request outdated (current=${requestIdRef.current}, this=${thisRequestId})`)
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
