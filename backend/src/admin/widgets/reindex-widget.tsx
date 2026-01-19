import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text } from "@medusajs/ui"
import { useState } from "react"

const ReindexWidget = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleReindex = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch("/admin/reindex-search", {
        method: "GET",
        credentials: "include",
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(`✅ Переиндексировано ${data.total} товаров`)
      } else {
        setResult(`❌ Ошибка: ${data.error}`)
      }
    } catch (error: any) {
      setResult(`❌ Ошибка: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Поиск</Heading>
          <Text className="text-ui-fg-subtle">
            Обновить индекс Meilisearch
          </Text>
        </div>
        <Button
          variant="secondary"
          onClick={handleReindex}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? "Индексация..." : "Переиндексировать"}
        </Button>
      </div>
      {result && (
        <div className="px-6 py-4">
          <Text>{result}</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default ReindexWidget
