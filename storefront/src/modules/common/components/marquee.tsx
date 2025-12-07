"use client"

import { useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"

type MarqueeProps = {
  children: React.ReactNode
  className?: string
}

const Marquee = ({ children, className }: MarqueeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth)
      }
    }

    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [children])

  return (
    <div 
      ref={containerRef} 
      className={clx("overflow-hidden whitespace-nowrap", className)}
    >
      <div 
        ref={textRef}
        className={clx("inline-block", {
          "animate-marquee hover:pause": isOverflowing
        })}
      >
        {children}
      </div>
    </div>
  )
}

export default Marquee
