import { Metadata } from "next"
import SearchResultsClient from "@modules/search/templates/search-results-client"

export const metadata: Metadata = {
  title: "Поиск",
  description: "Поиск товаров",
}

type Params = {
  params: Promise<{ countryCode: string; locale: string }>
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const query = searchParams.q || ""

  return (
    <div className="flex flex-col w-full">
      <SearchResultsClient 
        initialQuery={query} 
      />
    </div>
  )
}
