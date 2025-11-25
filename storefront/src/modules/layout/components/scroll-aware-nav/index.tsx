"use client"

import { useState, useEffect } from 'react'

type ScrollAwareNavProps = {
  children: React.ReactNode
}

export default function ScrollAwareNav({ children }: ScrollAwareNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className={isScrolled ? 'navbar-scrolled' : ''}>
      {children}
    </div>
  )
}

