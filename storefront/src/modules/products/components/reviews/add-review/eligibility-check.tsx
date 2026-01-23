"use client"

import React, { useEffect, useState } from "react"
import { checkReviewEligibility } from "@modules/products/components/reviews/actions"

interface EligibilityCheckProps {
  productId: string
  onCanReview: () => void
  onCannotReview: () => void
  children: (props: { canReview: boolean; isLoading: boolean }) => React.ReactNode
}

const EligibilityCheck: React.FC<EligibilityCheckProps> = ({
  productId,
  onCanReview,
  onCannotReview,
  children,
}) => {
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkEligibility = async () => {
      setIsLoading(true)
      try {
        const res = await checkReviewEligibility(productId)
        setCanReview(res.can_review)
        if (res.can_review) {
          onCanReview()
        } else {
          onCannotReview()
        }
      } catch (err) {
        console.error("[EligibilityCheck] Error:", err)
        setCanReview(false)
        onCannotReview()
      } finally {
        setIsLoading(false)
      }
    }

    checkEligibility()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  return <>{children({ canReview: canReview === true, isLoading })}</>
}

export default EligibilityCheck
