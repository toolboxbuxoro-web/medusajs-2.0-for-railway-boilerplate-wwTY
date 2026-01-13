import { Metadata } from "next"
import SearchModal from "@modules/search/templates/search-modal"
import SearchResultsTemplate from "@modules/search/templates/search-results-template"
import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Поиск",
  description: "Поиск товаров",
}

type Params = {
  params: { countryCode: string }
  searchParams: {
    q?: string
    sortBy?: SortOptions
    page?: string
    category_id?: string
    category_title?: string
    brand?: string
    min_price?: string
    max_price?: string
  }
}

export default async function SearchPage({ params, searchParams }: Params) {
  const query = searchParams.q

  // If no query, show the search modal
  if (!query) {
    return <SearchModal />
  }

  // If query exists, show search results
  // Phase 3: Web Search Client Rewrite - Simplification
  // Ignore SortOptions and Filters for now.
  try {
    // Only pass query. 
    // Backend now handles normalization and "Search ONLY by product.title, product.metadata.brand" internally via Meili config.
    const results = await search(query).catch(err => {
      console.error("[Search] Action failed:", err)
      return { hits: [], estimatedTotalHits: 0 }
    })

    const { hits = [], estimatedTotalHits = 0 } = results || {}

    const ids = (hits || [])
      .map((h: any) => h.id)
      .filter((id: any): id is string => typeof id === "string")

    return (
      <SearchResultsTemplate
        query={query}
        ids={ids}
        // Disable sorting/facets for stability (Phase 0)
        sortBy={undefined} 
        page={searchParams.page}
        countryCode={params.countryCode}
        facets={{}} 
        totalHits={estimatedTotalHits}
      />
    )
  } catch (error) {
    console.error("[Search] Page crash:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <h2 className="text-xl font-bold mb-2">Поиск временно недоступен</h2>
        <p className="text-gray-500">Пожалуйста, попробуйте обновить страницу или зайти позже.</p>
      </div>
    )
  }
}
