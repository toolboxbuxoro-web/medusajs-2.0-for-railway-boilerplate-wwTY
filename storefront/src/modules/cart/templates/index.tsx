import ItemsTemplate from "./items"
import Summary from "./summary"
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
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <>
            {/* Mobile Layout */}
            <div className="lg:hidden">
              <div className="flex flex-col gap-4 sm:gap-6">
                {!customer && <SignInPrompt />}
                <ItemsTemplate items={cart?.items} />
                {cart && cart.region && (
                  <Summary cart={cart as any} />
                )}
                {region && (
                  <RecommendedProducts
                    countryCode={countryCode || "us"}
                    region={region}
                    currentProductIds={currentProductIds}
                  />
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
              <div className="flex flex-col gap-y-6">
                {!customer && <SignInPrompt />}
                <ItemsTemplate items={cart?.items} />
                {region && (
                  <RecommendedProducts
                    countryCode={countryCode || "us"}
                    region={region}
                    currentProductIds={currentProductIds}
                  />
                )}
              </div>
              <div className="relative">
                <div className="sticky top-24">
                  {cart && cart.region && (
                    <Summary cart={cart as any} />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyCartMessage />
        )}
      </div>
    </div>
  )
}

export default CartTemplate
