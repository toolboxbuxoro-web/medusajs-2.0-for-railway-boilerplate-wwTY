"use client"

import { Button } from "@medusajs/ui"
import React from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Произошла ошибка</h2>
      <p className="text-gray-500 text-center max-w-[400px] mb-8">
        Не удалось загрузить список заказов. Пожалуйста, попробуйте еще раз.
      </p>
      <Button variant="primary" onClick={() => reset()} className="min-w-[200px] py-4 rounded-2xl font-bold">
        Повторить попытку
      </Button>
    </div>
  )
}
