import { notFound } from "next/navigation"
import CartDropdown from "../cart-dropdown"
import Cart from "@modules/common/icons/cart"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getTranslations } from 'next-intl/server'

const fetchCart = async () => {
  const cart = await retrieveCart()

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart.items, cart.region_id!)
    cart.items = enrichedItems
  }

  return cart
}

export default async function CartButton() {
  const cart = await fetchCart()
  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const t = await getTranslations('nav')

  return (
    <LocalizedClientLink
      href="/cart"
      className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center sm:flex-col sm:gap-1"
      data-testid="nav-cart-link"
      title={t('cart')}
    >
      <Cart size="22" />
      {totalItems > 0 && (
        <span className="absolute top-0.5 right-0.5 sm:right-2 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
          {totalItems}
        </span>
      )}
      <span className="text-[10px] font-medium hidden sm:block">{t('cart')}</span>
    </LocalizedClientLink>
  )
}
