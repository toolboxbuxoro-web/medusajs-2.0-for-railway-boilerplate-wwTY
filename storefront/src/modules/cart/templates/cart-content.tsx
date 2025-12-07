"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
// RecommendedProducts removed
import { deleteLineItem } from "@lib/data/cart"

type CartContentProps = {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  countryCode?: string
  region: HttpTypes.StoreRegion | undefined
  recommendedProducts: React.ReactNode
}

const CartContent = ({
  cart,
  customer,
  countryCode,
  region,
  recommendedProducts,
}: CartContentProps) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  // Initialize selection with all items when cart loads
  useEffect(() => {
    if (cart?.items) {
      setSelectedItemIds(cart.items.map((item) => item.id))
    }
  }, [cart?.items?.length]) // Re-run if item count changes

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (!cart?.items) return
    if (selectedItemIds.length === cart.items.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(cart.items.map((item) => item.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItemIds.length === 0) return
    setIsProcessing(true)
    try {
      await Promise.all(selectedItemIds.map((id) => deleteLineItem(id)))
      setSelectedItemIds([])
    } catch (error) {
      console.error("Failed to delete items", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckout = async () => {
    if (!cart?.items) return

    const unselectedItems = cart.items.filter(
      (item) => !selectedItemIds.includes(item.id)
    )

    if (unselectedItems.length > 0) {
      // If there are unselected items, we need to remove them before proceeding
      // This implements "buy only selected"
      setIsProcessing(true)
      try {
        await Promise.all(unselectedItems.map((item) => deleteLineItem(item.id)))
        // After deleting, navigate to checkout
        // We need to wait for the cart to update? 
        // deleteLineItem revalidates "cart", so the next request should be fresh.
        // However, we might need to wait a bit or just proceed.
        
        // Determine step
        let step = "address"
        if (cart.shipping_address?.address_1 && cart.email) {
            step = "delivery"
            if ((cart.shipping_methods?.length ?? 0) > 0) {
                step = "payment"
            }
        }
        
        router.push(`/checkout?step=${step}`)
      } catch (error) {
        console.error("Failed to remove unselected items", error)
        setIsProcessing(false)
      }
    } else {
      // All selected, just proceed
      let step = "address"
      if (cart.shipping_address?.address_1 && cart.email) {
          step = "delivery"
          if ((cart.shipping_methods?.length ?? 0) > 0) {
              step = "payment"
          }
      }
      router.push(`/checkout?step=${step}`)
    }
  }

  if (!cart?.items?.length) {
    return <EmptyCartMessage />
  }

  return (
    <div className="content-container" data-testid="cart-container">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="flex flex-col gap-4 sm:gap-6">
          {!customer && <SignInPrompt />}
          <ItemsTemplate
            items={cart.items}
            selectedItemIds={selectedItemIds}
            toggleItem={toggleItem}
            toggleAll={toggleAll}
            handleDeleteSelected={handleDeleteSelected}
            isProcessing={isProcessing}
          />
          {cart.region && (
            <Summary
              cart={cart}
              selectedItemIds={selectedItemIds}
              handleCheckout={handleCheckout}
              isProcessing={isProcessing}
            />
          )}
          {recommendedProducts}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
        <div className="flex flex-col gap-y-6">
          {!customer && <SignInPrompt />}
          <ItemsTemplate
            items={cart.items}
            selectedItemIds={selectedItemIds}
            toggleItem={toggleItem}
            toggleAll={toggleAll}
            handleDeleteSelected={handleDeleteSelected}
            isProcessing={isProcessing}
          />
          {recommendedProducts}
        </div>
        <div className="relative">
          <div className="sticky top-24">
            {cart.region && (
              <Summary
                cart={cart}
                selectedItemIds={selectedItemIds}
                handleCheckout={handleCheckout}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartContent
