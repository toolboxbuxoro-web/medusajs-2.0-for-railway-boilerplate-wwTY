import { Metadata } from "next"

import SearchResultsTemplate from "@modules/search/templates/search-results-template"

import { search } from "@modules/search/actions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Search",
  description: "Explore all of our products.",
}

type Params = {
  params: { query: string; countryCode: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category_id?: string
    category_title?: string
    brand?: string
    min_price?: string
    max_price?: string
  }
}

export default async function SearchResults({ params, searchParams }: Params) {
  const { query } = params
  const { sortBy, page } = searchParams

  const results = await search(query, sortBy, {
    category_id: searchParams.category_id,
    category_title: searchParams.category_title,
    brand: searchParams.brand,
    min_price: searchParams.min_price,
    max_price: searchParams.max_price,
  })

  const { hits, facetDistribution, estimatedTotalHits } = results

  const ids = hits
    .map((h: any) => h.id)
    .filter((id: any): id is string => {
      return typeof id === "string"
    })

  return (
    <SearchResultsTemplate
      query={query}
      ids={ids}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      facets={facetDistribution}
      totalHits={estimatedTotalHits}
    />
  )
}
