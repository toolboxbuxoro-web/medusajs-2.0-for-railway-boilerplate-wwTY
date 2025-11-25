import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import { useTranslations } from 'next-intl'

const EmptyCartMessage = () => {
  const t = useTranslations('cart')
  
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        {t('your_cart')}
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        {t('empty_cart')}
      </Text>
      <div>
        <InteractiveLink href="/store">{t('start_shopping')}</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
