"use client"

import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from 'next-intl'

import { useIntersection } from "@lib/hooks/use-in-view"
import { useToast } from "@lib/context/toast-context"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import QuickOrderModal from "../quick-order-modal"
import { addToCart } from "@lib/data/cart"
import { useAuth } from "@lib/context/auth-context"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

// Форматирует цену: убирает .00 и ,00 и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  // Сначала убираем ,00 или .00 в конце
  const smoothPrice = priceString.replace(/[.,]00$/, "")
  // Затем заменяем разделяющие запятые на пробелы (если они остались в середине числа)
  return smoothPrice.replace(/,/g, " ")
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const t = useTranslations('product')
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false)
  const [isQuickOrdering, setIsQuickOrdering] = useState(false)
  const countryCode = useParams().countryCode as string
  const router = useRouter()
  const { toast } = useToast()

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  // Debug logging
  useEffect(() => {
    console.log("[ProductActions] Product:", product)
    console.log("[ProductActions] Options State:", options)
    console.log("[ProductActions] Selected Variant:", selectedVariant)
    console.log("[ProductActions] In Stock:", inStock)
  }, [product, options, selectedVariant, inStock])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      console.log("[ProductActions] No variants found")
      return
    }

    // If there is only one variant, always return it regardless of options
    // This handles cases where data might be incomplete or "Simple Product" usage
    if (product.variants.length === 1) {
      return product.variants[0]
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      const match = isEqual(variantOptions, options)
      console.log(`[ProductActions] Checking variant ${v.id}:`, { variantOptions, currentOptions: options, match })
      return match
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // Debug logging
  useEffect(() => {
    console.log("[ProductActions] Product:", product)
    console.log("[ProductActions] Options State:", options)
    console.log("[ProductActions] Selected Variant:", selectedVariant)
    console.log("[ProductActions] In Stock:", inStock)
  }, [product, options, selectedVariant, inStock])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)
    setAddError(null)

    try {
      const res = await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode: (countryCode || "uz").toLowerCase(),
      })
      
      if (!res.success) {
        const errorMsg = res.error || "Не удалось добавить товар в корзину"
        setAddError(errorMsg)
        toast({
          title: "Ошибка",
          description: errorMsg,
          variant: "error"
        })
      } else {
        toast({
          title: "Успешно",
          description: "Товар добавлен в корзину",
          variant: "success"
        })
      }
    } catch (e: any) {
      console.error("[ProductActions] addToCart failed:", e)
      const errorMsg = e?.message || "Не удалось добавить товар в корзину"
      setAddError(errorMsg)
      toast({
        title: "Ошибка",
        description: errorMsg,
        variant: "error"
      })
    } finally {
      setIsAdding(false)
    }
  }

  const { authStatus } = useAuth()

  const handleQuickOrder = async () => {
    setIsQuickOrdering(true)
    try {
      if (authStatus === "authorized") {
        // Logged in user: Add to cart and redirect to checkout (Buy Now behavior)
        if (!selectedVariant?.id) return

        const res = await addToCart({
          variantId: selectedVariant.id,
          quantity: 1,
          countryCode: (countryCode || "uz").toLowerCase(),
        })

        if (res.success) {
          router.push(`/${countryCode}/checkout`)
        } else {
          const errorMsg = res.error || "Не удалось добавить товар"
          setAddError(errorMsg)
          toast({
             title: "Ошибка",
             description: errorMsg,
             variant: "error"
          })
        }
      } else {
        // Guest user: Open Quick Order Modal
        setIsQuickOrderOpen(true)
      }
    } catch (e) {
      console.error(e)
      setIsQuickOrderOpen(true) // Fallback to modal on error
    } finally {
      setIsQuickOrdering(false)
    }
  }

  const { variantPrice, cheapestPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })

  const selectedPrice = selectedVariant ? variantPrice : cheapestPrice
  const isOnSale = selectedPrice?.price_type === "sale"

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.title ?? ""]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {isOnSale && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-3 rounded-lg mb-4">
            <div className="text-sm font-medium mb-1">{t('black_friday')} {selectedPrice?.percentage_diff}%</div>
            {selectedPrice?.original_price && (
                  <div className="flex items-center gap-2">
                <span className="text-xs line-through opacity-75">{selectedPrice.original_price}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                  {t('your_benefit')} {formatPrice(convertToLocale({ amount: (selectedPrice.original_price_number || 0) - (selectedPrice.calculated_price_number || 0), currency_code: selectedPrice.currency_code }))}
                </span>
              </div>
            )}
          </div>
        )}

        <ProductPrice product={product} variant={selectedVariant} />

        {/* Stock availability indicator */}
        <div className="my-4">
          {inStock ? (
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm">{t('available_in_city', { count: selectedVariant?.inventory_quantity || 0 })}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm font-medium">{t('out_of_stock')}</span>
            </div>
          )}
        </div>

        {/* BTS Pickup Info - No Couriers */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-green-700 font-medium">{t('bts_pickup_today')}</span>
          </div>

          <a 
            href={`/${countryCode}/stores`}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 ml-7 transition-colors"
          >
            <span>{t('bts_stores_available')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Warranty Badge - Only show if product has warranty */}
        {(product.metadata as any)?.warranty && (
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{t('warranty_badge', { time: String((product.metadata as any).warranty) })}</span>
          </div>
        )}

        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          variant="primary"
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold text-lg mb-3 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-100"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? t('select_variant')
            : !inStock
            ? t('out_of_stock')
            : t('add_to_cart')}
        </Button>
        {addError && (
          <div className="text-red-600 text-sm mt-2 mb-2 text-center" data-testid="add-error-message">
            {addError}
          </div>
        )}
        {/* Trust micro-copy */}
        <div className="text-xs text-gray-400 text-center mt-2 mb-3 px-4">
          {t('trust_microcopy')}
        </div>
        <Button
          variant="secondary"
          className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-2xl border-none transition-all"
          onClick={handleQuickOrder}
          disabled={!selectedVariant || !inStock || isQuickOrdering}
          isLoading={isQuickOrdering}
        >
          {t('quick_order')}
        </Button>

        <QuickOrderModal
          product={product}
          variant={selectedVariant}
          isOpen={isQuickOrderOpen}
          onClose={() => setIsQuickOrderOpen(false)}
        />
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
