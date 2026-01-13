"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type SuggestionProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string
}

type SuggestionCategory = {
  id: string
  title: string
  handle: string
}

type SuggestionsResponse = {
  products: SuggestionProduct[]
  categories: SuggestionCategory[]
  brands: string[]
}

type PopularResponse = {
  queries: string[]
}

export default function SearchAutocomplete({ 
  query, 
  onClose 
}: { 
  query: string
  onClose: () => void 
}) {
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [popular, setPopular] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract base path for localized navigation (e.g., /ru/uz)
  const pathParts = pathname.split('/')
  const basePath = pathParts.length >= 3 ? `/${pathParts[1]}/${pathParts[2]}` : ''

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/search/popular`, {
          headers: getMedusaHeaders(),
        })
        const data: PopularResponse = await res.json()
        setPopular(data.queries)
      } catch (e) {
        console.error("Failed to fetch popular searches", e)
      }
    }
    fetchPopular()
  }, [])

  useEffect(() => {
    if (!query) {
      setSuggestions(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${MEDUSA_BACKEND_URL}/store/search/suggestions?q=${encodeURIComponent(query)}`, {
          headers: getMedusaHeaders(),
        })
        const data: SuggestionsResponse = await res.json()
        setSuggestions(data)
      } catch (e) {
        console.error("Failed to fetch suggestions", e)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  if (!query && popular.length > 0) {
    return (
      <div className="bg-white rounded-b-lg border-x border-b border-gray-200 shadow-xl p-4 w-full mt-1">
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">🔥 Популярные запросы</Text>
        <div className="flex flex-wrap gap-2">
          {popular.map((q) => (
            <button
              key={q}
              onClick={() => {
                router.push(`${basePath}/search?q=${encodeURIComponent(q)}`)
                onClose()
              }}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!suggestions || (!suggestions.products.length && !suggestions.categories.length && !suggestions.brands.length)) {
    return null
  }

  return (
    <div className="bg-white rounded-b-lg border-x border-b border-gray-200 shadow-xl overflow-hidden w-full mt-1">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Categories & Brands */}
        <div className="w-full md:w-1/3 bg-gray-50 p-4 border-r border-gray-100">
          {suggestions.categories.length > 0 && (
            <div className="mb-6">
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">📂 Категории</Text>
              <ul className="space-y-2">
                {suggestions.categories.map((cat) => (
                  <li key={cat.id}>
                    <LocalizedClientLink
                      href={`/categories/${cat.handle}`}
                      onClick={onClose}
                      className="text-sm font-medium hover:text-primary transition-colors block py-0.5"
                    >
                      {cat.title}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.brands.length > 0 && (
            <div>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">🏷 Бренды</Text>
              <ul className="space-y-2">
                {suggestions.brands.map((brand) => (
                  <li key={brand}>
                    <button
                      onClick={() => {
                        router.push(`${basePath}/search?q=${encodeURIComponent(brand)}`)
                        onClose()
                      }}
                      className="text-sm font-medium hover:text-primary transition-colors block py-0.5 text-left w-full"
                    >
                      {brand}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Top Products */}
        <div className="w-full md:w-2/3 p-4 bg-white">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">🔍 Товары</Text>
          <div className="space-y-3">
            {suggestions.products.map((product) => (
              <LocalizedClientLink
                key={product.id}
                href={`/products/${product.handle}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 group"
              >
                <div className="w-12 h-12 relative flex-shrink-0">
                  <Thumbnail thumbnail={product.thumbnail} size="small" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-sm font-bold text-dark truncate group-hover:text-primary transition-colors">
                    {product.title}
                  </Text>
                  <Text className="text-xs text-gray-500">Посмотреть товар</Text>
                </div>
              </LocalizedClientLink>
            ))}
            <button
               onClick={() => {
                  router.push(`${basePath}/search?q=${encodeURIComponent(query)}`)
                  onClose()
               }}
               className="w-full text-center py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors mt-2 border border-primary/20"
            >
               Смотреть все результаты по запросу "{query}"
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
