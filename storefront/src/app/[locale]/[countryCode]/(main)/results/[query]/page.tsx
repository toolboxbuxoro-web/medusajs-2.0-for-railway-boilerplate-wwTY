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

  const pageNumber = page ? parseInt(page) : 1
  const limit = 24
  const offset = (pageNumber - 1) * limit

  const results = await search(query, offset, params.countryCode)

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
