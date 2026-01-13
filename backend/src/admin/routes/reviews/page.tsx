import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, CheckCircle, XCircle, ChevronDownMini, ChevronUpMini, ArrowUpRightOnBox } from "@medusajs/icons"
import { 
  Container, 
  Heading, 
  Table, 
  Text, 
  StatusBadge, 
  Button, 
  clx,
  toast,
  Tabs,
  Prompt,
  Input,
  Label
} from "@medusajs/ui"
import { useEffect, useState, useCallback, useMemo } from "react"

// Types matching the backend API response
interface Review {
  id: string
  rating: number
  comment?: string
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  created_at: string
  product_id: string
  product?: {
    id: string
    title: string
    thumbnail?: string
  }
  customer?: {
    phone?: string
    first_name?: string
    last_name?: string
  }
}

const ExpandableComment = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = text.length > 100

  return (
    <div className="flex flex-col gap-y-1">
      <Text size="small" className={clx("break-words", !isExpanded && "line-clamp-2")}>
        {text}
      </Text>
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-xs font-medium flex items-center gap-x-1 w-fit"
        >
          {isExpanded ? (
            <><ChevronUpMini /> Свернуть</>
          ) : (
            <><ChevronDownMini /> Показать полностью</>
          )}
        </button>
      )}
    </div>
  )
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  
  // Reject Modal State
  const [rejectingReview, setRejectingReview] = useState<Review | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = statusFilter 
        ? `/admin/reviews?status=${statusFilter}&limit=50` 
        : "/admin/reviews?limit=50"
      const response = await fetch(url, { credentials: "include" })
      const data = await response.json()
      setReviews(data.reviews)
      setCount(data.count)
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      toast.error("Ошибка при загрузке отзывов")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected", reason?: string) => {
    // Optimistic Update
    const previousReviews = [...reviews]
    setReviews(prev => prev.filter(r => r.id !== id))
    setCount(prev => prev - 1)

    try {
      const endpoint = `/admin/reviews/${id}/${status === "approved" ? "approve" : "reject"}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: status === "rejected" ? JSON.stringify({ reason }) : undefined,
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast.success(status === "approved" ? "Отзыв одобрен" : "Отзыв отклонен")
      // No need to refetch if optimistic was correct, but good for total count accuracy
      if (statusFilter === "") fetchReviews() 
    } catch (error) {
      setReviews(previousReviews) // Revert on failure
      setCount(previousReviews.length)
      console.error("Failed to update review status:", error)
      toast.error("Ошибка при обновлении статуса")
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectingReview) return
    setIsRejecting(true)
    await handleUpdateStatus(rejectingReview.id, "rejected", rejectionReason)
    setRejectingReview(null)
    setRejectionReason("")
    setIsRejecting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "green"
      case "rejected": return "red"
      default: return "orange"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Одобрен"
      case "rejected": return "Отклонен"
      default: return "Ожидает"
    }
  }

  return (
    <Container className="flex flex-col gap-y-6 py-8">
      <div className="flex flex-col gap-y-1">
        <Heading level="h1">Отзывы о товарах</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Модерация и управление отзывами покупателей ({count} всего в этой вкладке)
        </Text>
      </div>

      <Tabs 
        value={statusFilter} 
        onValueChange={setStatusFilter}
        className="w-full"
      >
        <Tabs.List>
          <Tabs.Trigger value="pending">Ожидают ({statusFilter === "pending" ? count : "..."})</Tabs.Trigger>
          <Tabs.Trigger value="approved">Одобренные ({statusFilter === "approved" ? count : "..."})</Tabs.Trigger>
          <Tabs.Trigger value="rejected">Отклоненные ({statusFilter === "rejected" ? count : "..."})</Tabs.Trigger>
          <Tabs.Trigger value="">Все</Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Товар</Table.HeaderCell>
            <Table.HeaderCell>Покупатель</Table.HeaderCell>
            <Table.HeaderCell>Рейтинг</Table.HeaderCell>
            <Table.HeaderCell>Комментарий</Table.HeaderCell>
            <Table.HeaderCell>Статус</Table.HeaderCell>
            <Table.HeaderCell>Дата</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Действия</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {reviews.length === 0 && !isLoading && (
            <Table.Row>
              <Table.Cell colSpan={7} className="text-center py-20">
                <div className="flex flex-col items-center gap-y-2 opacity-50">
                  <ChatBubbleLeftRight className="w-10 h-10" />
                  <Text>Отзывов не найдено</Text>
                </div>
              </Table.Cell>
            </Table.Row>
          )}
          {isLoading && reviews.length === 0 && (
             <Table.Row>
              <Table.Cell colSpan={7} className="text-center py-20">
                 <Text>Загрузка...</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {reviews.map((review) => (
            <Table.Row key={review.id}>
              <Table.Cell>
                <div className="flex items-center gap-x-3 max-w-[250px]">
                  {review.product?.thumbnail ? (
                    <img 
                      src={review.product.thumbnail} 
                      alt="" 
                      className="w-10 h-10 rounded-md object-cover border border-ui-border-base bg-ui-bg-subtle"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center">
                      <ChatBubbleLeftRight className="text-ui-fg-muted" />
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <a 
                      href={`/admin/products/${review.product_id}`}
                      target="_blank"
                      className="truncate font-medium hover:text-ui-fg-interactive flex items-center gap-x-1"
                    >
                      {review.product?.title || "Неизвестный товар"}
                      <ArrowUpRightOnBox className="shrink-0" />
                    </a>
                    <span className="text-[10px] text-ui-fg-subtle truncate uppercase tracking-tighter">
                      ID: {review.product_id.split('_').pop()}
                    </span>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col">
                  <span className="font-medium">{review.customer?.first_name} {review.customer?.last_name || "Покупатель"}</span>
                  <span className="text-xs text-ui-fg-subtle">{review.customer?.phone || "№ телефона скрыт"}</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-x-1">
                  <span className="font-bold text-lg">{review.rating}</span>
                  <span className="text-yellow-400 text-lg">★</span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="max-w-[350px] py-2">
                  {review.comment ? (
                    <ExpandableComment text={review.comment} />
                  ) : (
                    <em className="text-ui-fg-muted text-xs italic">Без комментария</em>
                  )}
                  {review.status === "rejected" && review.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
                      <Text size="xsmall" className="text-red-600 font-medium">Причина отказа:</Text>
                      <Text size="xsmall" className="text-red-500 italic">{review.rejection_reason}</Text>
                    </div>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <StatusBadge color={getStatusColor(review.status)}>
                  {getStatusLabel(review.status)}
                </StatusBadge>
              </Table.Cell>
              <Table.Cell>
                <span className="text-xs text-ui-fg-subtle">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
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
                      <CheckCircle className="mr-1" /> Одобрить
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => setRejectingReview(review)}
                      className="text-red-600 hover:text-red-700 bg-red-50 border-red-200"
                    >
                      <XCircle className="mr-1" /> Отклонить
                    </Button>
                  </div>
                )}
                {review.status !== "pending" && (
                   <div className="flex flex-col items-end gap-y-0.5">
                      <Text size="xsmall" className="text-ui-fg-muted font-medium">Модерировано</Text>
                      <Text size="xsmall" className="text-[10px] text-ui-fg-subtle">ID: {review.id.split('_').pop()}</Text>
                   </div>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Reject Modal */}
      <Prompt
         open={!!rejectingReview}
         onOpenChange={(open: boolean) => !open && setRejectingReview(null)}
      >
        <Prompt.Content className="max-w-[400px]">
          <Prompt.Header>
            <Prompt.Title>Отклонить отзыв</Prompt.Title>
            <Prompt.Description>
              Вы собираетесь отклонить отзыв от <strong>{rejectingReview?.customer?.first_name}</strong> на товар <strong>{rejectingReview?.product?.title}</strong>.
            </Prompt.Description>
          </Prompt.Header>
          <div className="flex flex-col gap-y-2 mt-4">
            <Label htmlFor="rejection-reason" className="text-ui-fg-subtle">Причина (необязательно)</Label>
            <Input 
               id="rejection-reason"
               placeholder="Например: содержит ненормативную лексику"
               value={rejectionReason}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectionReason(e.target.value)}
            />
          </div>
          <Prompt.Footer>
            <Button variant="secondary" onClick={() => setRejectingReview(null)}>
              Отмена
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRejectSubmit}
              isLoading={isRejecting}
            >
              Подтвердить отклонение
            </Button>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Отзывы",
  icon: ChatBubbleLeftRight,
})

export default ReviewsPage
