"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Text, Button } from "@medusajs/ui"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class CheckoutErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CheckoutErrorBoundary] Uncaught error:', error, errorInfo)
    
    // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="max-w-md text-center space-y-4">
            <div className="text-6xl">😔</div>
            <Text className="text-xl font-bold text-gray-900">
              Произошла ошибка при оформлении заказа
            </Text>
            <Text className="text-gray-600">
              Мы уже получили уведомление и работаем над исправлением.
              Попробуйте обновить страницу или вернуться позже.
            </Text>
            <div className="flex gap-3 justify-center mt-6">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Обновить страницу
              </Button>
              <Button 
                onClick={() => window.location.href = '/cart'}
                variant="secondary"
              >
                Вернуться в корзину
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left border-t border-gray-200 pt-4 w-full">
                <summary className="cursor-pointer text-sm font-mono text-gray-500 hover:text-gray-800">
                  Детали ошибки (dev only)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60 font-mono text-red-700">
                  <p className="font-bold mb-2">{this.state.error.toString()}</p>
                  <pre>{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CheckoutErrorBoundary
