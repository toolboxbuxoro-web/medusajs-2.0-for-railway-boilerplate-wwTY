import { notFound } from "next/navigation"
import CartDropdown from "../cart-dropdown"
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
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 2L7 6m6-4l2 4M3 6h18l-2 12H5L3 6z" />
        <circle cx="7" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </LocalizedClientLink>
  )
}
