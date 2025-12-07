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
      className="p-2 hover:text-red-600 transition-colors relative"
      data-testid="nav-cart-link"
      title={t('cart')}
    >
      <Cart size="22" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </LocalizedClientLink>
  )
}
