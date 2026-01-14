"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Heading, Text } from "@medusajs/ui"
import { useInfiniteSearch } from "@lib/hooks/use-infinite-search"
import SearchGrid from "@modules/search/components/search-grid"
import SearchFallback from "@modules/search/components/search-fallback"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { MagnifyingGlassMini as MagnifyingGlass } from "@medusajs/icons"

export default function SearchResultsClient({ initialQuery }: { initialQuery: string }) {
  const { query, setQuery, items, status, hasMore, loadMore, mode, totalHits } = useInfiniteSearch(initialQuery)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialized = useRef(false)

  // Sync URL when query changes (debounced)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }

    const currentParams = new URLSearchParams(searchParams.toString())
    if (query) {
      currentParams.set("q", query)
    } else {
      currentParams.delete("q")
    }
    
    // Use replace to avoid bloating history
    router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false })
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
      <SearchGrid 
        items={items} 
        status={status} 
        hasMore={hasMore} 
        loadMore={loadMore} 
      />
    </div>
  )
}
