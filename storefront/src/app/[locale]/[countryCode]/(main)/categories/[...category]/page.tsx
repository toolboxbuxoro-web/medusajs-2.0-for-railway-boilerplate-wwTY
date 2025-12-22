import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { getLocalizedField } from "@lib/util/localization"
import { generateAlternates } from "@lib/util/seo"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// Force dynamic rendering to avoid DYNAMIC_SERVER_USAGE errors
export const dynamic = "force-dynamic"

type Props = {
  params: { category: string[]; countryCode: string; locale: string }
  searchParams: {
    sortBy?: SortOptions
    page?: string
  }
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(
      params.category
    )

    const title = product_categories
      .map((category: StoreProductCategory) => 
        getLocalizedField(category, "name", params.locale) || category.name
      )
      .join(" | ")

    const lastCategory = product_categories[product_categories.length - 1]
    const description =
      getLocalizedField(lastCategory, "description", params.locale) ||
      `${title} category.`

    const alternates = generateAlternates(
      params.countryCode,
      `/categories/${params.category.join("/")}`,
      params.locale
    )

    return {
      title: `${title} | Toolbox`,
      description,
      alternates,
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  const { product_categories } = await getCategoryByHandle(
    params.category
  )

  if (!product_categories || product_categories.length === 0) {
    notFound()
  }

  return (
    <CategoryTemplate
      categories={product_categories}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      locale={params.locale}
    />
  )
}
