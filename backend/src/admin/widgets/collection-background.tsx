import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"

type WidgetProps = {
  data: {
    id: string
    title: string
    handle: string
    metadata?: Record<string, any>
  }
}

const CollectionBackgroundWidget = ({ data }: WidgetProps) => {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff")
  const [textColor, setTextColor] = useState<string>("#000000") // optional
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setEnabled(Boolean(data.metadata?.colored_background))
    setBackgroundColor(data.metadata?.background_color as string || "#ffffff")
    setTextColor(data.metadata?.text_color as string || "#111827")
  }, [data])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/collections/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            colored_background: enabled,
            background_color: backgroundColor,
            text_color: textColor,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      setMessage({ type: "success", text: "Цвет фона сохранён ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    marginTop: "4px"
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "4px"
  }

  return (
    <div style={{ 
      background: "white", 
      borderRadius: "8px", 
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      border: "1px solid #e5e7eb",
      marginTop: "16px"
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>🎨 Цвет фона страницы</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Настройка цвета фона для страницы этой коллекции
        </p>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              Включить цветной фон
            </span>
          </label>
          <span style={{ 
            padding: "2px 8px", 
            fontSize: "11px", 
            background: enabled ? "#dcfce7" : "#f3f4f6",
            color: enabled ? "#166534" : "#6b7280",
            borderRadius: "4px",
            fontWeight: 500
          }}>
            {enabled ? "ВКЛ" : "ВЫКЛ"}
          </span>
        </div>

        {enabled && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Background Color */}
            <div>
              <label style={labelStyle}>Цвет фона (HEX)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{ width: "40px", height: "40px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label style={labelStyle}>Цвет текста (HEX)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ width: "40px", height: "40px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#000000"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            marginTop: "8px",
            padding: "10px 16px",
            background: isSaving ? "#9ca3af" : "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600
          }}
        >
          {isSaving ? "Сохранение..." : "💾 Сохранить настройки"}
        </button>

        {message && (
          <p style={{ 
            margin: 0, 
            fontSize: "12px", 
            color: message.type === "success" ? "#10b981" : "#ef4444" 
          }}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product_collection.details.after",
})

export default CollectionBackgroundWidget
