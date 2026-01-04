"use client"

import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslations } from 'next-intl'

const SignInPrompt = () => {
  const t = useTranslations('cart')
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('sign_in_prompt')}</h3>
        <p className="text-sm text-gray-600">
          {t('sign_in_description')}
        </p>
      </div>
        <LocalizedClientLink href="/account">
        <Button className="bg-red-600 hover:bg-red-700 text-white px-6" data-testid="sign-in-button">
          {t('sign_in')}
          </Button>
        </LocalizedClientLink>
    </div>
  )
}

export default SignInPrompt
