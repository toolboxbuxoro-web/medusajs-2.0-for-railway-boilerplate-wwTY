import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

type WidgetProps = {
  data: {
    id: string
    name?: string
    metadata?: Record<string, any>
  }
}

type UploadResponse = {
  files?: Array<{
    id?: string
    url?: string
    file_url?: string
    key?: string
  }>
}

const ProductCategoryImageWidget = ({ data }: WidgetProps) => {
  const initialImageUrl = (data.metadata?.image_url as string) || ""

  const [imageUrl, setImageUrl] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setImageUrl(initialImageUrl)
    setFile(null)
  }, [data.id, initialImageUrl])

  const hasImage = useMemo(() => Boolean(imageUrl), [imageUrl])

  const uploadAndSave = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Выберите файл (JPG/PNG/WebP)" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const form = new FormData()
      form.append("files", file)

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

      if (!url) {
        throw new Error("Upload did not return a URL")
      }

      const saveRes = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            image_url: url,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to save category metadata")
      }

      setImageUrl(url)
      setFile(null)
      setMessage({ type: "success", text: "Фото категории сохранено ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка загрузки/сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const saveRes = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata,
            image_url: null,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to remove image")
      }

      setImageUrl("")
      setFile(null)
      setMessage({ type: "success", text: "Фото удалено ✓" })
      setTimeout(() => setMessage(null), 3000)
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
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Фото категории (1:1)</h2>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
          Категория: <b>{data.name || data.id}</b>
        </p>

        {hasImage ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <img
              src={imageUrl}
              alt="Category image"
              style={{
                width: "72px",
                height: "72px",
                objectFit: "cover",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            />
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none" }}
            >
              Открыть файл
            </a>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Фото не задано</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={uploadAndSave}
              disabled={isSaving || !file}
              style={{
                padding: "8px 12px",
                background: isSaving || !file ? "#9ca3af" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSaving || !file ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {isSaving ? "..." : "Загрузить и сохранить"}
            </button>

            <button
              onClick={removeImage}
              disabled={isSaving || !hasImage}
              style={{
                padding: "8px 12px",
                background: isSaving || !hasImage ? "#9ca3af" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSaving || !hasImage ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Удалить
            </button>
          </div>
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

        <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
          Рекомендация: квадрат 600×600 (или минимум 256×256), WebP/PNG/JPG.
        </p>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.after",
})

export default ProductCategoryImageWidget









