"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation"
import { Heading, Text } from "@medusajs/ui"
import { useInfiniteSearch } from "@lib/hooks/use-infinite-search"
import SearchGrid from "@modules/search/components/search-grid"
import SearchFallback from "@modules/search/components/search-fallback"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { MagnifyingGlassMini as MagnifyingGlass } from "@medusajs/icons"

export default function SearchResultsClient({ initialQuery }: { initialQuery: string }) {
  const params = useParams()
  const countryCode = params?.countryCode as string || "uz"
  const locale = params?.locale as string || "ru"
  const { query, setQuery, items, status, hasMore, loadMore, mode, totalHits } = useInfiniteSearch(initialQuery, countryCode, locale)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialized = useRef(false)

  // Fix: Sync internal state when URL/initialQuery changes
  useEffect(() => {
    console.log(`[SearchResultsClient] Sync check: initialQuery="${initialQuery}", query="${query}", initialized=${initialized.current}`)
    if (initialQuery !== query) {
      console.log(`[SearchResultsClient] Syncing: calling setQuery("${initialQuery}")`)
      setQuery(initialQuery)
    }
  }, [initialQuery, query, setQuery])

  // Sync URL when query changes (debounced)
  useEffect(() => {
    if (!initialized.current) {
      console.log(`[SearchResultsClient] Skipping URL sync on initial mount`)
      initialized.current = true
      return
    }

    const currentQueryParam = searchParams.get("q") || ""
    console.log(`[SearchResultsClient] URL sync check: query="${query}", URL param="${currentQueryParam}"`)
    
    // Only update URL if it's different from current query
    if (currentQueryParam === query) {
      console.log(`[SearchResultsClient] URL already matches query, skipping update`)
      return
    }

    console.log(`[SearchResultsClient] Syncing URL: query="${query}"`)
    const currentParams = new URLSearchParams(searchParams.toString())
    if (query) {
      currentParams.set("q", query)
    } else {
      currentParams.delete("q")
    }
    
    const newUrl = `${pathname}?${currentParams.toString()}`
    console.log(`[SearchResultsClient] Updating URL to: ${newUrl}`)
    
    // Use replace to avoid bloating history
    router.replace(newUrl, { scroll: false })
  }, [query, searchParams, pathname, router])

  // Reset scroll on query change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [query])

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Search Header */}
      <div className="flex items-center justify-between border-b w-full py-6 px-8 small:px-14 bg-white sticky top-[64px] z-40">
        <div className="flex flex-col items-start gap-y-1">
          <Text className="text-ui-fg-muted text-xs uppercase tracking-widest font-bold">
            {mode === "recommendation" ? "Рекомендации" : "Результаты поиска"}
          </Text>
          <div className="flex items-center gap-x-2">
            <Heading className="text-xl">
              {mode === "recommendation" ? "Для вас" : (mode === "fallback" ? `Поиск: ${query}` : decodeURI(query))}
            </Heading>
            {mode !== "fallback" && (
              <span className="text-ui-fg-muted text-sm font-medium">
                  ({totalHits})
              </span>
            )}
          </div>
        </div>
        
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="text-ui-fg-subtle hover:text-red-600 transition-colors text-sm font-medium"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Zero results Fallback header */}
      {mode === "fallback" && query && (
        <SearchFallback query={query} />
      )}

      {/* Main Grid */}
      <div className="content-container py-6">
        <SearchGrid 
          items={items} 
          status={status} 
          hasMore={hasMore} 
          loadMore={loadMore} 
        />
      </div>
    </div>
  )
}
