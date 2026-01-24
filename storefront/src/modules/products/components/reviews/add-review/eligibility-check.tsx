"use client"

import React, { useEffect, useState } from "react"
import { checkReviewEligibility } from "@modules/products/components/reviews/actions"

interface EligibilityCheckProps {
  productId: string
  onCanReview: () => void
  onCannotReview: () => void
  children: (props: { canReview: boolean | null; isLoading: boolean; error: string | null; reason?: string }) => React.ReactNode
}

const EligibilityCheck: React.FC<EligibilityCheckProps> = ({
  productId,
  onCanReview,
  onCannotReview,
  children,
}) => {
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [reason, setReason] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEligibility = async () => {
      if (!productId || productId === "undefined" || productId === "null") {
        setCanReview(null) // Reset to null instead of false
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const res = await checkReviewEligibility(productId)
        setCanReview(res.can_review)
        setReason(res.reason)
        if (res.can_review) {
          onCanReview()
        } else {
          onCannotReview()
        }
      } catch (err: any) {
        console.error("[EligibilityCheck] Error:", err)
        setError(err.message || "Failed to check eligibility")
        setCanReview(false)
        setReason("error")
        onCannotReview()
      } finally {
        setIsLoading(false)
      }
    }

    checkEligibility()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  return <>{children({ canReview, isLoading, error, reason })}</>
}

export default EligibilityCheck
