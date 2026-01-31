import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"
import { convertToWebP, uploadFile } from "./utils/image-processor"

type Banner = {
  id: string
  order?: number
  file_id?: string
  image_url?: string
  href?: string
  title?: string
  subtitle?: string
  description?: string
  cta?: string
  title_uz?: string
  subtitle_uz?: string
  description_uz?: string
  cta_uz?: string
  device?: "mobile" | "web" | "all"
}

type WidgetProps = {
  data: {
    id: string
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

const uid = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis as any
  return typeof c.crypto?.randomUUID === "function"
    ? c.crypto.randomUUID()
    : `bnr_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const StoreBannersWidget = ({ data }: WidgetProps) => {
  const existingBanners: Banner[] = useMemo(() => {
    const raw = data.metadata?.banners
    return Array.isArray(raw) ? (raw as Banner[]) : []
  }, [data.metadata])

  const [banners, setBanners] = useState<Banner[]>([])

  const [file, setFile] = useState<File | null>(null)
  const [href, setHref] = useState<string>("/")
  const [title, setTitle] = useState<string>("")
  const [subtitle, setSubtitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [cta, setCta] = useState<string>("")

  const [titleUz, setTitleUz] = useState<string>("")
  const [subtitleUz, setSubtitleUz] = useState<string>("")
  const [descriptionUz, setDescriptionUz] = useState<string>("")
  const [ctaUz, setCtaUz] = useState<string>("")
  const [device, setDevice] = useState<"mobile" | "web" | "all">("all")

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setBanners(existingBanners.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
  }, [existingBanners])

  const saveBanners = async (nextBanners: Banner[]) => {
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch(`/admin/stores/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...(data.metadata || {}),
            banners: nextBanners,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save banners")
      }

      setBanners(nextBanners)
      setMessage({ type: "success", text: "Баннеры сохранены ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  const addBanner = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Выберите файл баннера" })
      return
    }

    // Validation: Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Файл слишком большой (макс. 10МБ)" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Convert to WebP first
      setMessage({ type: "success", text: "Конвертация в WebP..." })
      const webpFile = await convertToWebP(file)
      
      // Upload to Medusa file service
      setMessage({ type: "success", text: "Загрузка файла..." })
      const { url: imageUrl, id: fileId } = await uploadFile(webpFile)

      const next: Banner = {
        id: uid(),
        order: banners.length ? Math.max(...banners.map((b) => b.order ?? 0)) + 1 : 0,
        file_id: fileId,
        image_url: imageUrl,
        href: href || "/",
        title,
        subtitle,
        description,
        cta,
        title_uz: titleUz || undefined,
        subtitle_uz: subtitleUz || undefined,
        description_uz: descriptionUz || undefined,
        cta_uz: ctaUz || undefined,
        device,
      }

      const nextBanners = [...banners, next]
      await saveBanners(nextBanners)

      // reset form
      setFile(null)
      setHref("/")
      setTitle("")
      setSubtitle("")
      setDescription("")
      setCta("")
      setTitleUz("")
      setSubtitleUz("")
      setDescriptionUz("")
      setCtaUz("")
      setDevice("all")
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка добавления баннера" })
      setIsSaving(false)
    }
  }

  const deleteBanner = async (banner: Banner) => {
    const ok = confirm("Удалить баннер? (Файл тоже будет удалён из MinIO)")
    if (!ok) return

    setIsSaving(true)
    setMessage(null)

    try {
      // 1) remove from store metadata
      const nextBanners = banners.filter((b) => b.id !== banner.id)
      await saveBanners(nextBanners)

      // 2) delete file (best-effort)
      if (banner.file_id) {
        await fetch(`/admin/uploads/${banner.file_id}`, {
          method: "DELETE",
          credentials: "include",
        })
      }

      setMessage({ type: "success", text: "Баннер удалён ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setMessage({ type: "error", text: "Ошибка удаления" })
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
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Баннеры (загрузка в MinIO)</h2>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          Баннеры сохраняются в <code>store.metadata.banners</code>. Картинки загружаются через <code>/admin/uploads</code>
          (MinIO включён при наличии переменных MINIO_*).
        </div>

        {/* Existing banners */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {banners.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Баннеров пока нет</div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "96px",
                    height: "56px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    flexShrink: 0,
                  }}
                >
                  {b.image_url ? (
                    <img
                      src={b.image_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                    {b.title || "(без заголовка)"}
                    <span style={{
                      padding: "2px 6px",
                      fontSize: "10px",
                      borderRadius: "4px",
                      fontWeight: 500,
                      background: b.device === "mobile" ? "#dbeafe" : b.device === "web" ? "#fef3c7" : "#dcfce7",
                      color: b.device === "mobile" ? "#1d4ed8" : b.device === "web" ? "#92400e" : "#166534"
                    }}>
                      {b.device === "mobile" ? "📱 Mobile" : b.device === "web" ? "🌐 Web" : "🌍 All"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    href: <code>{b.href || "/"}</code> • file_id: <code>{b.file_id || "-"}</code>
                  </div>
                </div>
                <button
                  onClick={() => deleteBanner(b)}
                  disabled={isSaving}
                  style={{
                    padding: "8px 10px",
                    background: isSaving ? "#9ca3af" : "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Добавить баннер</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input
              type="text"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="Ссылка (href), например /store"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Устройство:</span>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value as "mobile" | "web" | "all")}
                style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px" }}
              >
                <option value="all">🌍 Все устройства</option>
                <option value="mobile">📱 Только мобильные</option>
                <option value="web">🌐 Только веб</option>
              </select>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок (RU)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Подзаголовок (RU)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (RU)"
              rows={3}
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Кнопка CTA (RU)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />

            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>UZ поля (опционально)</div>
            <input
              type="text"
              value={titleUz}
              onChange={(e) => setTitleUz(e.target.value)}
              placeholder="Заголовок (UZ)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <input
              type="text"
              value={subtitleUz}
              onChange={(e) => setSubtitleUz(e.target.value)}
              placeholder="Подзаголовок (UZ)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <textarea
              value={descriptionUz}
              onChange={(e) => setDescriptionUz(e.target.value)}
              placeholder="Описание (UZ)"
              rows={3}
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />
            <input
              type="text"
              value={ctaUz}
              onChange={(e) => setCtaUz(e.target.value)}
              placeholder="Кнопка CTA (UZ)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
            />

            <button
              onClick={addBanner}
              disabled={isSaving}
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: isSaving ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {isSaving ? "..." : "Добавить баннер"}
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
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreBannersWidget















