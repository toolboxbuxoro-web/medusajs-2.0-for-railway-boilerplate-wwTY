import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"

import { getCategoriesList } from "@lib/data/categories"
import { getLocalizedField } from "@lib/util/localization"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"

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

const CategoryCard = ({
  category,
  locale,
}: {
  category: HttpTypes.StoreProductCategory
  locale: string
}) => {
  const name = getLocalizedField(category, "name", locale) || category.name
  const imageUrl = category.metadata?.image_url as string | undefined
  const iconUrl = category.metadata?.icon_url as string | undefined

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="group bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
          {name}
        </div>
        {category.category_children?.length ? (
          <div className="text-xs text-gray-500 mt-1">
            {category.category_children.length}
          </div>
        ) : null}
      </div>

      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : iconUrl ? (
          <div className="relative w-10 h-10">
            <Image
              src={iconUrl}
              alt=""
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
        ) : (
          <span className="text-gray-400 font-bold text-lg">
            {(name || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default async function CategoriesPage(props: Props) {
  const params = await props.params
  const t = await getTranslations({ locale: params.locale, namespace: "nav" })
  const { product_categories } = await getCategoriesList(0, 200)

  if (!product_categories) {
    notFound()
  }

  const mainCategories =
    product_categories?.filter((cat: any) => !cat.parent_category) || []

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="content-container py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="heading-2">{t("catalog")}</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            {t("categories")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {mainCategories.map((c: HttpTypes.StoreProductCategory) => (
            <CategoryCard key={c.id} category={c} locale={params.locale} />
          ))}
        </div>
      </div>
    </div>
  )
}




