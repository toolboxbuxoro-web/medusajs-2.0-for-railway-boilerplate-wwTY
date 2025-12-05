import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

import { useTranslations } from 'next-intl'

const Help = () => {
  const t = useTranslations('order')
  
  return (
    <div className="mt-6">
      <Heading className="text-base-semi">{t('need_help')}</Heading>
      <div className="text-base-regular my-2">
        <ul className="gap-y-2 flex flex-col">
          <li>
            <LocalizedClientLink href="/contact">{t('contact')}</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/contact">
              {t('returns_exchanges')}
            </LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Help
