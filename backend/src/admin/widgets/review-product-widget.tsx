import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, StatusBadge, Button, toast, Text, clx } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"
import { CheckCircle, XCircle, ChatBubbleLeftRight } from "@medusajs/icons"

type WidgetProps = {
  data: {
    id: string
  }
}

const ReviewProductWidget = ({ data }: WidgetProps) => {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/admin/reviews?product_id=${data.id}&limit=100`, { credentials: "include" })
      const json = await response.json()
      setReviews(json.reviews)
    } catch (error) {
      console.error("Error fetching reviews for product:", error)
    } finally {
      setIsLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleUpdateStatus = async (reviewId: string, status: "approved" | "rejected") => {
    // Optimistic Update
    const previousReviews = [...reviews]
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r))

    try {
      const endpoint = `/admin/reviews/${reviewId}/${status === "approved" ? "approve" : "reject"}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast.success(status === "approved" ? "Отзыв одобрен" : "Отзыв отклонен")
    } catch (error) {
      setReviews(previousReviews)
      toast.error("Ошибка при обновлении статуса")
    }
  }

  if (reviews.length === 0 && !isLoading) return null

  return (
    <Container className="p-0 overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-ui-border-base bg-ui-bg-subtle/50 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
           <ChatBubbleLeftRight className="text-ui-fg-subtle" />
           <Heading level="h2">Отзывы покупателей ({reviews.length})</Heading>
        </div>
        <Text size="xsmall" className="text-ui-fg-muted font-medium uppercase tracking-widest">
           Последние отзывы
        </Text>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Рейтинг</Table.HeaderCell>
            <Table.HeaderCell>Комментарий</Table.HeaderCell>
            <Table.HeaderCell>Статус</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Действия</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {reviews.map((review) => (
            <Table.Row key={review.id} className={clx(review.status === "pending" && "bg-ui-bg-highlight/10")}>
              <Table.Cell>
               <div className="flex items-center gap-x-1">
                  <span className="font-bold text-lg">{review.rating}</span>
                  <span className="text-yellow-400 text-lg">★</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="max-w-[500px] py-1">
                   <Text size="small" className="break-words line-clamp-3">
                    {review.comment || <em className="text-ui-fg-muted italic">Без комментария</em>}
                  </Text>
                  <div className="flex items-center gap-x-2 mt-1">
                     <Text size="xsmall" className="text-ui-fg-subtle font-medium">
                        {review.customer?.first_name || "Покупатель"}
                     </Text>
                     <span className="text-ui-fg-muted text-[10px]">•</span>
                     <Text size="xsmall" className="text-ui-fg-muted">
                        {new Date(review.created_at).toLocaleDateString()}
                     </Text>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <StatusBadge color={review.status === "approved" ? "green" : review.status === "rejected" ? "red" : "orange"}>
                  {review.status === "approved" ? "Одобрен" : review.status === "rejected" ? "Отклонен" : "Ожидает"}
                </StatusBadge>
              </Table.Cell>
              <Table.Cell className="text-right">
                {review.status === "pending" && (
                  <div className="flex items-center justify-end gap-x-2">
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => handleUpdateStatus(review.id, "approved")}
                      className="text-green-600 hover:text-green-700 bg-green-50 border-green-200"
                    >
                      <CheckCircle size={16} className="mr-1" /> Одобрить
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => handleUpdateStatus(review.id, "rejected")}
                      className="text-red-600 hover:text-red-700 bg-red-50 border-red-200"
                    >
                      <XCircle size={16} className="mr-1" /> Отклонить
                    </Button>
                  </div>
                )}
                {review.status !== "pending" && (
                   <Text size="xsmall" className="text-ui-fg-muted italic">Обработан</Text>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ReviewProductWidget
