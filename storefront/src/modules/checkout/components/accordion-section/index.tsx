"use client"

import React from "react"
import { clx, Heading, Text } from "@medusajs/ui"
import { CheckCircleSolid, LockClosedSolid } from "@medusajs/icons"

interface AccordionSectionProps {
  number: number
  title: string
  isOpen: boolean
  isCompleted: boolean
  isLocked?: boolean
  summary?: React.ReactNode
  onToggle?: () => void
  children: React.ReactNode
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  number,
  title,
  isOpen,
  isCompleted,
  isLocked = false,
  summary,
  onToggle,
  children,
}) => {
  return (
    <div 
      id={`checkout-section-${number}`}
      className={clx(
        "bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden",
        {
          "border-blue-200 ring-1 ring-blue-100": isOpen,
          "border-gray-100": !isOpen,
          "opacity-60": isLocked,
        }
      )}
    >
      {/* Header */}
      <div 
        className={clx(
          "p-5 flex items-center justify-between cursor-pointer select-none",
          {
            "bg-blue-50/30": isOpen,
            "hover:bg-gray-50": !isOpen && !isLocked,
            "cursor-not-allowed": isLocked,
          }
        )}
        onClick={() => !isLocked && onToggle?.()}
      >
        <div className="flex items-center gap-4">
          <div className={clx(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
            {
              "bg-blue-600 text-white": isOpen,
              "text-green-500 bg-transparent": isCompleted && !isOpen,
              "bg-gray-200 text-gray-500": !isOpen && !isCompleted && !isLocked,
              "bg-gray-100 text-gray-400": isLocked,
            }
          )}>
            {isCompleted && !isOpen ? <CheckCircleSolid className="w-7 h-7" /> : number}
          </div>
          
          <div className="flex flex-col">
            <Heading level="h2" className={clx("text-lg font-bold transition-colors", {
              "text-blue-900": isOpen,
              "text-gray-900": !isOpen && !isLocked,
              "text-gray-400": isLocked,
            })}>
              {title}
            </Heading>
            
            {!isOpen && isCompleted && summary && (
              <div className="mt-1 animation-fade-in">
                {summary}
              </div>
            )}
          </div>
        </div>

        <div>
          {isLocked ? (
            <LockClosedSolid className="text-gray-400 w-5 h-5" />
          ) : !isOpen && isCompleted ? (
            <Text className="text-blue-600 font-medium text-sm hover:underline">
              Изменить
            </Text>
          ) : (
            <div className={clx("w-5 h-5 transition-transform duration-300", { "rotate-180": isOpen })}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className={clx("transition-all duration-300 ease-in-out overflow-hidden", {
          "max-h-[2000px] opacity-100 pb-6 px-6": isOpen,
          "max-h-0 opacity-0": !isOpen,
        })}
      >
        <div className="pt-2 border-t border-gray-50">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AccordionSection
