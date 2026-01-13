"use client"

import { useEffect } from "react"
import { Heading, Text, Button } from "@medusajs/ui"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Search Page Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <Heading level="h2" className="mb-4 text-2xl font-bold">
        Что-то пошло не так
      </Heading>
      <Text className="mb-6 text-ui-fg-subtle max-w-md">
        При загрузке результатов поиска произошла ошибка. Пожалуйста, попробуйте обновить страницу.
      </Text>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="secondary">
          Обновить страницу
        </Button>
        <Button onClick={() => reset()} variant="primary">
          Попробовать снова
        </Button>
      </div>
    </div>
  )
}
