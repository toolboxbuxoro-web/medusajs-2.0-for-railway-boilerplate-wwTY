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

const ProductCategoryIconWidget = ({ data }: WidgetProps) => {
  const initialIconUrl = (data.metadata?.icon_url as string) || ""

  const [iconUrl, setIconUrl] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setIconUrl(initialIconUrl)
    setFile(null)
  }, [data.id, initialIconUrl])

  const hasIcon = useMemo(() => Boolean(iconUrl), [iconUrl])

  // Получить актуальные метаданные категории с сервера
  const fetchCurrentMetadata = async (): Promise<Record<string, any>> => {
    const res = await fetch(`/admin/product-categories/${data.id}`, {
      method: "GET",
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Failed to fetch category metadata")
    }

    const category = await res.json()
    return category.product_category?.metadata || {}
  }

  const uploadAndSave = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Выберите файл (PNG/SVG/WebP)" })
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

      // Получить актуальные метаданные перед сохранением
      const currentMetadata = await fetchCurrentMetadata()

      const saveRes = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...currentMetadata,
            icon_url: url,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to save category metadata")
      }

      setIconUrl(url)
      setFile(null)
      setMessage({ type: "success", text: "Иконка сохранена ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка загрузки/сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  const removeIcon = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      // Получить актуальные метаданные перед сохранением
      const currentMetadata = await fetchCurrentMetadata()

      const saveRes = await fetch(`/admin/product-categories/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...currentMetadata,
            icon_url: null,
          },
        }),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to remove icon")
      }

      setIconUrl("")
      setFile(null)
      setMessage({ type: "success", text: "Иконка удалена ✓" })
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
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Иконка категории</h2>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
          Категория: <b>{data.name || data.id}</b>
        </p>

        {hasIcon ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <img
              src={iconUrl}
              alt="Category icon"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "6px",
              }}
            />
            <a
              href={iconUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "12px", color: "#3b82f6", textDecoration: "none" }}
            >
              Открыть файл
            </a>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Иконка не задана</p>
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
              onClick={removeIcon}
              disabled={isSaving || !hasIcon}
              style={{
                padding: "8px 12px",
                background: isSaving || !hasIcon ? "#9ca3af" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isSaving || !hasIcon ? "not-allowed" : "pointer",
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
          Совет: лучше SVG или PNG 64×64 / 128×128 с прозрачным фоном.
        </p>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.side.after",
})

export default ProductCategoryIconWidget















