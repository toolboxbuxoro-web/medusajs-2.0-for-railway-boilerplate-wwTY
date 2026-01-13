"use client"

import React from "react"

interface AvatarInitialsProps {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  size?: number
  backgroundColor?: string
  textColor?: string
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  phone?: string | null
): string {
  if (firstName) {
    const first = firstName.charAt(0).toUpperCase()
    const last = lastName?.charAt(0).toUpperCase() || ""
    return first + last
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "")
    return digits.slice(-2) || "?"
  }
  return "?"
}

const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  firstName,
  lastName,
  phone,
  size = 48,
  backgroundColor = "#DC2626",
  textColor = "#FFFFFF",
}) => {
  const initials = getInitials(firstName, lastName, phone)

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold select-none flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor,
        color: textColor,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  )
}

export default AvatarInitials
