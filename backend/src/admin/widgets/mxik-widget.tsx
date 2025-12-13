import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"

type WidgetProps = {
  data: {
    id: string
    metadata?: Record<string, any>
  }
}

/**
 * MXIK (IKPU) Widget for Product Details
 * Displays and allows editing of the MXIK fiscal code for products
 */
const MxikWidget = ({ data }: WidgetProps) => {
  const [mxikCode, setMxikCode] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const currentMxik = data.metadata?.mxik_code || ""
    setMxikCode(currentMxik)
  }, [data])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            mxik_code: mxikCode || null,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save MXIK code")
      }

      setMessage({ type: "success", text: "MXIK код сохранён ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ 
      background: "white", 
      borderRadius: "8px", 
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      border: "1px solid #e5e7eb"
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>MXIK (ИКПУ) код</h2>
      </div>
      <div style={{ padding: "16px" }}>
        <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#6b7280" }}>
          Код для фискализации чеков
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Например: 84672100"
            value={mxikCode}
            onChange={(e) => setMxikCode(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "8px 16px",
              background: isSaving ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isSaving ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            {isSaving ? "..." : "Сохранить"}
          </button>
        </div>
        {message && (
          <p style={{ 
            margin: "8px 0 0", 
            fontSize: "12px", 
            color: message.type === "success" ? "#10b981" : "#ef4444" 
          }}>
            {message.text}
          </p>
        )}
        <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#9ca3af" }}>
          Если не указан — используется MXIK категории
        </p>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default MxikWidget
