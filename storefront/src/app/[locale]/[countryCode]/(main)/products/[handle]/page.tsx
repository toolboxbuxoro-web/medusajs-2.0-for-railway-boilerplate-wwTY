import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { getLocalizedField } from "@lib/util/localization"
import { generateAlternates } from "@lib/util/seo"
import { parseProductMetadata } from "@modules/products/types/product-metadata"

type Props = {
  params: Promise<{ locale: string; countryCode: string; handle: string }>
}

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  if (!countryCodes) {
    return null
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, locale, countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  // Parse structured metadata with safe defaults
  const metadata = parseProductMetadata(product.metadata)

  // SEO Fallback Chain:
  // title: seo_title → localized title → product.title
  // description: seo_description → short_description → localized description → product.description
  const localizedTitle = getLocalizedField(product, "title", locale) || product.title
  const localizedDescription = getLocalizedField(product, "description", locale) || product.description || ""

  const seoTitle = metadata.seo_title || localizedTitle
  const seoDescription = 
    metadata.seo_description || 
    metadata.short_description || 
    localizedDescription.slice(0, 160)

  const alternates = generateAlternates(
    countryCode,
    `/products/${handle}`,
    locale
  )

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: metadata.seo_keywords.length > 0 ? metadata.seo_keywords : undefined,
    alternates,
    openGraph: {
      title: `${seoTitle} | Toolbox`,
      description: seoDescription,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

import { getCustomer } from "@lib/data/customer"

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const customer = await getCustomer()

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(params.handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      locale={params.locale}
    />
  )
}
