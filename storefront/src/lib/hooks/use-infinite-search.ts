"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { search } from "@modules/search/actions"

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

export function useInfiniteSearch(initialQuery: string = "") {
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
      // We don't have abort support in the server action easily, 
      // but we can ignore results if query changed.
      const offset = page * 24
      const results = await search(query, offset)

      const { hits = [], estimatedTotalHits = 0, mode = "search" } = results

      setState(prev => {
        // If results came back but user already changed query, discard.
        if (prev.query !== query && isNewSearch) return prev

        const newItems = isNewSearch ? hits : [...prev.items, ...hits]
        // Stop loading if: no new hits returned OR we have all items
        const hasMore = hits.length > 0 && newItems.length < estimatedTotalHits

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
  }, [])

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
    fetchData(state.query, state.page + 1, false)
  }, [state.query, state.page, state.status, state.hasMore, fetchData])

  const setQuery = useCallback((newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }))
  }, [])

  return {
    ...state,
    setQuery,
    loadMore,
  }
}
