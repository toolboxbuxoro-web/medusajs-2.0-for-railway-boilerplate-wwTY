import ItemsTemplate from "./items"
import Summary from "./summary"
import CartContent from "./cart-content"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import RecommendedProducts from "../components/recommended-products"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@lib/data/regions"

const CartTemplate = async ({
  cart,
  customer,
  countryCode,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  countryCode?: string
}) => {
  const region = countryCode ? await getRegion(countryCode) : cart?.region
  const currentProductIds = cart?.items?.map(item => item.product_id).filter(Boolean) as string[] || []

  return (
    <div className="py-6 sm:py-8 lg:py-12 bg-gray-50 min-h-screen">
      <CartContent
        cart={cart}
        customer={customer}
        countryCode={countryCode}
        region={region || undefined}
        recommendedProducts={
          region && (
            <RecommendedProducts
              countryCode={countryCode || "us"}
              region={region}
              currentProductIds={currentProductIds}
            />
          )
        }
      />
    </div>
  )
}

export default CartTemplate
