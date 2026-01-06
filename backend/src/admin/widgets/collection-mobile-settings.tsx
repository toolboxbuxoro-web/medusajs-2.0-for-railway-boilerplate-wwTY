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

const CollectionMobileSettingsWidget = ({ data }: WidgetProps) => {
  const [mobileHome, setMobileHome] = useState<boolean>(false)
  const [mobileOrder, setMobileOrder] = useState<number>(0)
  const [titleRu, setTitleRu] = useState<string>("")
  const [titleUz, setTitleUz] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setMobileHome(Boolean(data.metadata?.mobile_home))
    setMobileOrder(Number(data.metadata?.mobile_order) || 0)
    setTitleRu(data.metadata?.title_ru || "")
    setTitleUz(data.metadata?.title_uz || "")
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
            mobile_home: mobileHome,
            mobile_order: mobileOrder,
            title_ru: titleRu || undefined,
            title_uz: titleUz || undefined,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      setMessage({ type: "success", text: "Настройки мобильного сохранены ✓" })
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
      border: "1px solid #e5e7eb"
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>📱 Мобильное приложение</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Настройки отображения на главной мобильного приложения
        </p>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Toggle: Mobile Home */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={mobileHome}
              onChange={(e) => setMobileHome(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              Показывать на главной мобильного
            </span>
          </label>
          <span style={{ 
            padding: "2px 8px", 
            fontSize: "11px", 
            background: mobileHome ? "#dcfce7" : "#f3f4f6",
            color: mobileHome ? "#166534" : "#6b7280",
            borderRadius: "4px",
            fontWeight: 500
          }}>
            {mobileHome ? "ВКЛ" : "ВЫКЛ"}
          </span>
        </div>

        {/* Order */}
        <div>
          <label style={labelStyle}>Порядок отображения</label>
          <input
            type="number"
            min={0}
            value={mobileOrder}
            onChange={(e) => setMobileOrder(Number(e.target.value) || 0)}
            placeholder="0"
            style={{ ...inputStyle, width: "100px" }}
          />
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>
            Меньше = выше на главной (1, 2, 3...)
          </p>
        </div>

        {/* Title RU */}
        <div>
          <label style={labelStyle}>Заголовок для мобильного (RU)</label>
          <input
            type="text"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder={data.title || "Хиты продаж"}
            style={inputStyle}
          />
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>
            Оставьте пустым — будет использован стандартный заголовок
          </p>
        </div>

        {/* Title UZ */}
        <div>
          <label style={labelStyle}>Заголовок для мобильного (UZ)</label>
          <input
            type="text"
            value={titleUz}
            onChange={(e) => setTitleUz(e.target.value)}
            placeholder="Eng yaxshi mahsulotlar"
            style={inputStyle}
          />
        </div>

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

export default CollectionMobileSettingsWidget
