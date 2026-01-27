"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react"

export type CheckoutSection = 1 | 2 | 3

export interface ContactSummary {
  firstName: string
  lastName: string
  phone: string
  region?: string
  point?: string
}

export interface PaymentSummary {
  method: string
  icon?: React.ReactNode
}

interface CheckoutContextType {
  activeSection: CheckoutSection
  setActiveSection: (section: CheckoutSection) => void
  
  contactCompleted: boolean
  deliveryCompleted: boolean
  paymentCompleted: boolean
  
  contactSummary: ContactSummary | null
  paymentSummary: PaymentSummary | null
  
  setContactCompleted: (summary: ContactSummary) => void
  setPaymentCompleted: (summary: PaymentSummary) => void
  
  resetSection: (section: CheckoutSection) => void
  
  deliveryCost: number | null
  setDeliveryCost: (cost: number | null) => void
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined)

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<CheckoutSection>(1)
  const [contactCompleted, setContactCompletedState] = useState(false)
  const [paymentCompleted, setPaymentCompletedState] = useState(false)
  
  const [contactSummary, setContactSummary] = useState<ContactSummary | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null)

  const setActiveSection = useCallback((section: CheckoutSection) => {
    setActiveSectionState(section)
    // When switching to a section, we might want to scroll to it
    // This is handled in the component layer usually, but we keep state here
  }, [])

  const setContactCompleted = useCallback((summary: ContactSummary) => {
    // Phase 3: Validation
    if (!summary.firstName?.trim() || !summary.lastName?.trim() || !summary.phone?.trim()) {
      console.error('[CheckoutContext] Invalid contact summary: Missing required fields', summary)
      return
    }
    
    // Optional logic check: If region is present, point should likely be present too
    if (summary.region && !summary.point) {
      console.warn('[CheckoutContext] Region is set but point is missing in summary')
    }
    
    setContactSummary(summary)
    setContactCompletedState(true)
  }, [])

  const setPaymentCompleted = useCallback((summary: PaymentSummary) => {
    if (!summary.method?.trim()) {
      console.error('[CheckoutContext] Invalid payment summary: Method is required')
      return
    }
    
    setPaymentSummary(summary)
    setPaymentCompletedState(true)
  }, [])

  const resetSection = useCallback((section: CheckoutSection) => {
    if (section === 1) {
      setContactCompletedState(false)
    } else if (section === 2) {
      setPaymentCompletedState(false)
    }
    setActiveSection(section)
  }, [setActiveSection])

  return (
    <CheckoutContext.Provider
      value={{
        activeSection,
        setActiveSection,
        contactCompleted,
        deliveryCompleted: contactCompleted, // Currently unified
        paymentCompleted,
        contactSummary,
        paymentSummary,
        setContactCompleted,
        setPaymentCompleted,
        resetSection,
        deliveryCost,
        setDeliveryCost,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider")
  }
  return context
}
