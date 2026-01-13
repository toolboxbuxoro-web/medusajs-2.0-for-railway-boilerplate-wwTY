"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"

type AuthStatus = "loading" | "authorized" | "unauthorized"

interface AuthContextType {
  authStatus: AuthStatus
  customer: HttpTypes.StoreCustomer | null
  hydrated: boolean
  refreshSession: () => Promise<void>
  setCustomer: (customer: HttpTypes.StoreCustomer | null) => void
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
  initialCustomer?: HttpTypes.StoreCustomer | null
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children,
  initialCustomer = null 
}) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    initialCustomer ? "authorized" : "loading"
  )
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(initialCustomer)
  const [hydrated, setHydrated] = useState(!!initialCustomer)

  const restoreSession = useCallback(async () => {
    // If we already have initialCustomer from SSR, we are authorized and hydrated
    if (initialCustomer && !hydrated) {
      setAuthStatus("authorized")
      setCustomer(initialCustomer)
      setHydrated(true)
      return
    }

    setAuthStatus("loading")
    try {
      const customer = await getCustomer()
      if (customer) {
        setCustomer(customer)
        setAuthStatus("authorized")
      } else {
        setCustomer(null)
        setAuthStatus("unauthorized")
      }
    } catch (error) {
      setCustomer(null)
      setAuthStatus("unauthorized")
    } finally {
      setHydrated(true)
    }
  }, [initialCustomer, hydrated])

  useEffect(() => {
    if (!initialCustomer) {
      restoreSession()
    } else {
      setHydrated(true)
    }
  }, [restoreSession, initialCustomer])

  const refreshSession = async () => {
    await restoreSession()
  }

  const login = async (token: string) => {
    // Revalidation and state update after login
    await restoreSession()
  }

  const logout = async () => {
    setCustomer(null)
    setAuthStatus("unauthorized")
  }

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        customer,
        hydrated,
        refreshSession,
        setCustomer,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
