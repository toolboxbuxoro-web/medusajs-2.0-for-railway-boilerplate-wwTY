import { getCategoriesList } from "@lib/data/categories"
import { getCollectionsList } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getTranslations } from 'next-intl/server'
import { HttpTypes } from "@medusajs/types"

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6)
  const { product_categories } = await getCategoriesList(0, 6)
  const t = await getTranslations('footer')

  return (
    <footer className="border-t border-ui-border-base w-full bg-gray-50">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-12 md:py-16">
          <div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase font-bold text-red-600"
            >
              Toolbox
            </LocalizedClientLink>
            <p className="text-sm text-gray-600 mt-2 max-w-xs">
              {t('tagline') || 'Профессиональные инструменты и оборудование'}
            </p>
          </div>
          
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base font-semibold">
                  {t('categories')}
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {product_categories?.slice(0, 6).map((c: HttpTypes.StoreProductCategory) => {
                    if (c.parent_category) {
                      return null
                    }

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className="hover:text-ui-fg-base"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base font-semibold">
                  {t('collections')}
                </span>
                <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base font-semibold">{t('info') || 'Информация'}</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    href="/delivery"
                    className="hover:text-ui-fg-base"
                  >
                    {t('delivery')}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/about"
                    className="hover:text-ui-fg-base"
                  >
                    {t('about') || 'О компании'}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/customer-service"
                    className="hover:text-ui-fg-base"
                  >
                    {t('support') || 'Поддержка'}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/stores"
                    className="hover:text-ui-fg-base"
                  >
                    {t('stores') || 'Магазины'}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="hover:text-ui-fg-base"
                  >
                    {t('account') || 'Личный кабинет'}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/cart"
                    className="hover:text-ui-fg-base"
                  >
                    {t('cart') || 'Корзина'}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="hover:text-ui-fg-base"
                  >
                    {t('all_products') || 'Все товары'}
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex w-full mb-8 justify-between text-ui-fg-muted border-t border-gray-200 pt-8">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Toolbox. {t('copyright')}
          </Text>
        </div>
      </div>
    </footer>
  )
}
