import { Metadata } from "next"
import SearchResultsClient from "@modules/search/templates/search-results-client"

export const metadata: Metadata = {
  title: "Поиск",
  description: "Поиск товаров",
}

type Params = {
  params: { countryCode: string; locale: string }
  searchParams: {
    q?: string
  }
}

export default async function SearchPage({ params, searchParams }: Params) {
  const query = searchParams.q || ""

  return (
    <div className="flex flex-col w-full">
      <SearchResultsClient 
        initialQuery={query} 
      />
    </div>
  )
}
