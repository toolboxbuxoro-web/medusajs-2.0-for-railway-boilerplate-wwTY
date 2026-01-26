import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoriesList } from "@lib/data/categories"
import { getTranslations } from "next-intl/server"
import { HttpTypes } from "@medusajs/types"
import CategoriesPageClient from "./categories-client"

type Props = {
  params: Promise<{ locale: string; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: "nav" })
  return {
    title: `${t("catalog")} | Toolbox`,
    description: t("catalog"),
  }
}

export default async function CategoriesPage(props: Props) {
  const params = await props.params
  const { product_categories } = await getCategoriesList(0, 200)

  if (!product_categories) {
    notFound()
  }

  const mainCategories =
    product_categories?.filter((cat: any) => !cat.parent_category && !cat.is_internal) || []

  return <CategoriesPageClient categories={mainCategories} locale={params.locale} />
}




