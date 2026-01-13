"use client"

import { useAuth } from "@lib/context/auth-context"
import React from "react"

interface AccountGatedWrapperProps {
  dashboard: React.ReactNode
  login: React.ReactNode
}

const AccountGatedWrapper: React.FC<AccountGatedWrapperProps> = ({
  dashboard,
  login,
}) => {
  const { authStatus, hydrated } = useAuth()

  if (!hydrated || authStatus === "loading") {
    return (
      <div className="flex flex-col gap-y-8 animate-pulse">
        <div className="w-full h-64 bg-gray-100 rounded-xl" />
        <div className="w-full h-96 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (authStatus === "authorized") {
    return <>{dashboard}</>
  }

  return <>{login}</>
}

export default AccountGatedWrapper
