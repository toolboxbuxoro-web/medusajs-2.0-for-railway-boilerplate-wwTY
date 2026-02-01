"use client"

import React, { createContext, useContext, useState } from "react"
import { clx } from "@medusajs/ui"

type ToastVariant = "info" | "success" | "warning" | "error" | "loading"

type ToastProps = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextType = {
  toast: (props: Omit<ToastProps, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = ({
    title,
    description,
    variant = "info",
    duration = 3000,
  }: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, variant, duration }
    
    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={clx(
              "pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg border p-4 transition-all animate-in slide-in-from-right",
              {
                "bg-white border-gray-200 text-gray-900": t.variant === "info",
                "bg-white border-green-200 text-green-700": t.variant === "success",
                "bg-white border-yellow-200 text-yellow-700": t.variant === "warning",
                "bg-white border-red-200 text-red-700": t.variant === "error",
              }
            )}
          >
             <div className="flex justify-between items-start">
               <div>
                  {t.title && <div className="font-semibold text-sm mb-1">{t.title}</div>}
                  {t.description && <div className="text-sm opacity-90">{t.description}</div>}
               </div>
               <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
