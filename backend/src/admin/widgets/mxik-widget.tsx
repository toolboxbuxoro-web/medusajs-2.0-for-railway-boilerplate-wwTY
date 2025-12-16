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
  const [packageCode, setPackageCode] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const currentMxik = data.metadata?.mxik_code || ""
    const currentPackage = data.metadata?.package_code || "2009"
    setMxikCode(currentMxik)
    setPackageCode(currentPackage)
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
            package_code: packageCode || "2009",
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save fiscal data")
      }

      setMessage({ type: "success", text: "Данные сохранены ✓" })
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
        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Фискальные данные (Payme)</h2>
      </div>
      <div style={{ padding: "16px" }}>
        
        {/* MXIK Code Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
            MXIK (ИКПУ) код
          </label>
          <input
            type="text"
            placeholder="Например: 06201001001000000"
            value={mxikCode}
            onChange={(e) => setMxikCode(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "4px"
            }}
          />
          <p style={{ margin: 0, fontSize: "11px", color: "#f59e0b" }}>
            ⚠️ Обязательно для фискализации
          </p>
        </div>

        {/* Package Code Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
            Код упаковки (Package Code)
          </label>
          <input
            type="text"
            placeholder="2009 (шт)"
            value={packageCode}
            onChange={(e) => setPackageCode(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>
            По умолчанию: 2009 (штука)
          </p>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
          
          {message && (
            <span style={{ 
              fontSize: "13px", 
              color: message.type === "success" ? "#10b981" : "#ef4444" 
            }}>
              {message.text}
            </span>
          )}
        </div>

      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default MxikWidget
