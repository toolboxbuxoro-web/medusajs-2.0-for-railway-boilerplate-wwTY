import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect, useMemo } from "react"

type BannerData = {
  image_url: string
  file_id?: string
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

type UploadResponse = {
  files?: Array<{
    id?: string
    url?: string
    file_url?: string
  }>
}

const emptyBanner: BannerData = {
  image_url: "",
  file_id: undefined,
  title: "",
  description: "",
  cta: "",
  href: ""
}

const CollectionBannerWidget = ({ data }: WidgetProps) => {
  const [activeTab, setActiveTab] = useState<"ru" | "uz">("ru")
  const [bannerRu, setBannerRu] = useState<BannerData>(emptyBanner)
  const [bannerUz, setBannerUz] = useState<BannerData>(emptyBanner)
  const [fileRu, setFileRu] = useState<File | null>(null)
  const [fileUz, setFileUz] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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
  const currentFile = activeTab === "ru" ? fileRu : fileUz
  const setCurrentFile = activeTab === "ru" ? setFileRu : setFileUz

  const hasImage = useMemo(() => Boolean(currentBanner.image_url), [currentBanner.image_url])

  const updateField = (field: keyof BannerData, value: string) => {
    setCurrentBanner(prev => ({ ...prev, [field]: value }))
  }

  // Convert image file to WebP format using Canvas API
  const convertToWebP = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert to WebP"))
              return
            }
            const baseName = file.name.replace(/\.[^.]+$/, "")
            const webpFile = new File([blob], `${baseName}.webp`, { type: "image/webp" })
            resolve(webpFile)
          },
          "image/webp",
          0.85 // quality 85%
        )
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (): Promise<{ url: string; file_id?: string } | null> => {
    if (!currentFile) return null

    setIsUploading(true)
    try {
      // Convert to WebP first
      const webpFile = await convertToWebP(currentFile)
      
      const form = new FormData()
      form.append("files", webpFile)

      const uploadRes = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: form,
      })

      if (!uploadRes.ok) {
        throw new Error("Upload failed")
      }

      const uploadJson = (await uploadRes.json()) as UploadResponse
      const uploaded = uploadJson.files?.[0]
      const url = uploaded?.url || uploaded?.file_url
      const file_id = uploaded?.id

      if (!url) {
        throw new Error("No URL in upload response")
      }

      return { url, file_id }
    } catch (error) {
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadAndSave = async () => {
    if (!currentFile) {
      setMessage({ type: "error", text: "Выберите файл (JPG/PNG/WebP)" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Upload file to MinIO
      const uploadResult = await uploadFile()
      if (!uploadResult) {
        throw new Error("Failed to upload file")
      }

      // Update banner data with new URL
      const updatedBanner = {
        ...currentBanner,
        image_url: uploadResult.url,
        file_id: uploadResult.file_id
      }

      // Update local state
      setCurrentBanner(updatedBanner)

      // Prepare both banners for save
      const newBannerRu = activeTab === "ru" ? updatedBanner : bannerRu
      const newBannerUz = activeTab === "uz" ? updatedBanner : bannerUz

      // Save to metadata
      const response = await fetch(`/admin/collections/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            banner_ru: newBannerRu,
            banner_uz: newBannerUz,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save banner")
      }

      setCurrentFile(null)
      setMessage({ type: "success", text: "Баннер загружен и сохранён ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка загрузки/сохранения" })
    } finally {
      setIsSaving(false)
    }
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

  const handleDeleteImage = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      // Delete file from MinIO if file_id exists
      if (currentBanner.file_id) {
        await fetch(`/admin/uploads/${currentBanner.file_id}`, {
          method: "DELETE",
          credentials: "include",
        }).catch(() => {}) // Ignore deletion errors
      }

      // Clear image from banner
      const updatedBanner = {
        ...currentBanner,
        image_url: "",
        file_id: undefined
      }

      setCurrentBanner(updatedBanner)

      // Prepare both banners for save
      const newBannerRu = activeTab === "ru" ? updatedBanner : bannerRu
      const newBannerUz = activeTab === "uz" ? updatedBanner : bannerUz

      // Save to metadata
      const response = await fetch(`/admin/collections/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            banner_ru: newBannerRu,
            banner_uz: newBannerUz,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete banner image")
      }

      setMessage({ type: "success", text: "Изображение удалено ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка удаления" })
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

  const buttonStyle = (disabled: boolean, color: string = "#3b82f6"): React.CSSProperties => ({
    padding: "8px 12px",
    background: disabled ? "#9ca3af" : color,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 500
  })

  return (
    <div style={{ 
      background: "white", 
      borderRadius: "8px", 
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      border: "1px solid #e5e7eb"
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>🖼️ Баннер коллекции (MinIO)</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
          Соотношение сторон 3:1 (например 1200×400). Загрузка через MinIO.
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
        {/* Current Image Preview */}
        {hasImage && (
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Текущий баннер</label>
            <div style={{ 
              borderRadius: "6px", 
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              position: "relative"
            }}>
              <img 
                src={currentBanner.image_url} 
                alt="Banner preview" 
                style={{ 
                  width: "100%", 
                  height: "auto",
                  aspectRatio: "3/1",
                  objectFit: "cover" 
                }}
              />
              <button
                onClick={handleDeleteImage}
                disabled={isSaving}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  padding: "4px 8px",
                  background: "rgba(239, 68, 68, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                ✕ Удалить
              </button>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>
            {hasImage ? "Заменить изображение" : "Загрузить изображение"}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCurrentFile(e.target.files?.[0] || null)}
              style={{ fontSize: "14px" }}
            />
            {currentFile && (
              <button
                onClick={handleUploadAndSave}
                disabled={isSaving || isUploading}
                style={buttonStyle(isSaving || isUploading, "#10b981")}
              >
                {isUploading ? "Загрузка..." : isSaving ? "Сохранение..." : "📤 Загрузить в MinIO"}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

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
            ...buttonStyle(isSaving)
          }}
        >
          {isSaving ? "Сохранение..." : "💾 Сохранить данные баннера"}
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
