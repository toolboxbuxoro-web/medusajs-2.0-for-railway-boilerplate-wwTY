import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"

type BannerData = {
  image_url: string
  title: string
  description: string
  cta: string
  href: string
}

type WidgetProps = {
  data: {
    id: string
    title: string
    handle: string
    metadata?: Record<string, any>
  }
}

const emptyBanner: BannerData = {
  image_url: "",
  title: "",
  description: "",
  cta: "",
  href: ""
}

const CollectionBannerWidget = ({ data }: WidgetProps) => {
  const [activeTab, setActiveTab] = useState<"ru" | "uz">("ru")
  const [bannerRu, setBannerRu] = useState<BannerData>(emptyBanner)
  const [bannerUz, setBannerUz] = useState<BannerData>(emptyBanner)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (data.metadata?.banner_ru) {
      setBannerRu(data.metadata.banner_ru)
    }
    if (data.metadata?.banner_uz) {
      setBannerUz(data.metadata.banner_uz)
    }
  }, [data])

  const currentBanner = activeTab === "ru" ? bannerRu : bannerUz
  const setCurrentBanner = activeTab === "ru" ? setBannerRu : setBannerUz

  const updateField = (field: keyof BannerData, value: string) => {
    setCurrentBanner(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/collections/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            banner_ru: bannerRu,
            banner_uz: bannerUz,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save banner")
      }

      setMessage({ type: "success", text: "Баннер сохранён ✓" })
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
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>🖼️ Баннер коллекции</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Соотношение сторон 3:1 (например 1200×400)
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
        <button
          onClick={() => setActiveTab("ru")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            background: activeTab === "ru" ? "#fff" : "#f9fafb",
            borderBottom: activeTab === "ru" ? "2px solid #3b82f6" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: activeTab === "ru" ? 600 : 400,
            color: activeTab === "ru" ? "#3b82f6" : "#6b7280"
          }}
        >
          🇷🇺 Русский
        </button>
        <button
          onClick={() => setActiveTab("uz")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            background: activeTab === "uz" ? "#fff" : "#f9fafb",
            borderBottom: activeTab === "uz" ? "2px solid #3b82f6" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: activeTab === "uz" ? 600 : 400,
            color: activeTab === "uz" ? "#3b82f6" : "#6b7280"
          }}
        >
          🇺🇿 O'zbek
        </button>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Image URL */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>URL изображения</label>
          <input
            type="text"
            placeholder="https://example.com/banner.jpg"
            value={currentBanner.image_url}
            onChange={(e) => updateField("image_url", e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Banner Preview */}
        {currentBanner.image_url && (
          <div style={{ 
            marginBottom: "12px", 
            borderRadius: "6px", 
            overflow: "hidden",
            border: "1px solid #e5e7eb"
          }}>
            <img 
              src={currentBanner.image_url} 
              alt="Preview" 
              style={{ 
                width: "100%", 
                height: "auto",
                aspectRatio: "3/1",
                objectFit: "cover" 
              }}
            />
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>Заголовок</label>
          <input
            type="text"
            placeholder="Чёрная пятница"
            value={currentBanner.title}
            onChange={(e) => updateField("title", e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>Описание</label>
          <textarea
            placeholder="Скидки до 50% на всю коллекцию..."
            value={currentBanner.description}
            onChange={(e) => updateField("description", e.target.value)}
            style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          />
        </div>

        {/* CTA & Link */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={labelStyle}>Текст кнопки</label>
            <input
              type="text"
              placeholder="Купить сейчас"
              value={currentBanner.cta}
              onChange={(e) => updateField("cta", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ссылка кнопки</label>
            <input
              type="text"
              placeholder="/store"
              value={currentBanner.href}
              onChange={(e) => updateField("href", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: isSaving ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 500
          }}
        >
          {isSaving ? "Сохранение..." : "Сохранить баннер"}
        </button>

        {message && (
          <p style={{ 
            margin: "8px 0 0", 
            fontSize: "12px", 
            textAlign: "center",
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
  zone: "product_collection.details.before",
})

export default CollectionBannerWidget
