import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

type WidgetProps = {
  data: {
    id: string
    name?: string
    description?: string | null
    metadata?: Record<string, any>
  }
}

const ProductCategoryUzTranslationWidget = ({ data }: WidgetProps) => {
  const initialNameUz = (data.metadata?.name_uz as string) || ""
  const initialDescUz = (data.metadata?.description_uz as string) || ""

  const [nameUz, setNameUz] = useState<string>("")
  const [descUz, setDescUz] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const isManualName = data.metadata?.name_uz_manual === true
  const isManualDesc = data.metadata?.description_uz_manual === true

  useEffect(() => {
    setNameUz(initialNameUz)
    setDescUz(initialDescUz)
  }, [data.id, initialNameUz, initialDescUz])

  const hasChanges = useMemo(() => {
    return nameUz !== initialNameUz || descUz !== initialDescUz
  }, [nameUz, descUz, initialNameUz, initialDescUz])

  const saveManual = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            name_uz: nameUz || null,
            description_uz: descUz || null,
            name_uz_manual: true,
            description_uz_manual: true,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save Uzbek category translation")
      }

      setMessage({ type: "success", text: "Перевод категории (UZ) сохранён ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  const enableAutoTranslate = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            name_uz: null,
            description_uz: null,
            name_uz_manual: false,
            description_uz_manual: false,
            name_uz_src: null,
            description_uz_src: null,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to enable auto translate")
      }

      setNameUz("")
      setDescUz("")
      setMessage({
        type: "success",
        text: "Автоперевод включён — перевод появится после обновления категории.",
      })
      setTimeout(() => setMessage(null), 5000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Перевод категории (UZ)</h2>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#6b7280" }}>Название (узбекский)</p>
          <input
            type="text"
            placeholder="Название на узбекском..."
            value={nameUz}
            onChange={(e) => setNameUz(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
        </div>

        <div>
          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#6b7280" }}>Описание (узбекский)</p>
          <textarea
            placeholder="Описание на узбекском..."
            value={descUz}
            onChange={(e) => setDescUz(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={saveManual}
            disabled={isSaving || !hasChanges}
            style={{
              padding: "8px 12px",
              background: isSaving || !hasChanges ? "#9ca3af" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isSaving || !hasChanges ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {isSaving ? "..." : "Сохранить (ручной)"}
          </button>

          <button
            onClick={enableAutoTranslate}
            disabled={isSaving}
            style={{
              padding: "8px 12px",
              background: isSaving ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Включить автоперевод
          </button>

          <span style={{ fontSize: "11px", color: "#6b7280" }}>
            RU: “{data.name || "-"}” • режим: {isManualName || isManualDesc ? "ручной" : "авто"}
          </span>
        </div>

        {message && (
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: message.type === "success" ? "#10b981" : "#ef4444",
            }}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.after",
})

export default ProductCategoryUzTranslationWidget












