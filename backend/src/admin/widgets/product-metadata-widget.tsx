import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState } from "react"

type WidgetProps = {
  data: {
    id: string
    metadata?: Record<string, any>
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  trigger: {
    padding: "12px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "1200px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky" as const,
    top: 0,
    background: "white",
    zIndex: 1,
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px 8px",
  },
  body: {
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  column: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    minHeight: "400px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "monospace",
    resize: "vertical" as const,
  },
  textareaError: {
    borderColor: "#ef4444",
  },
  pre: {
    background: "#1f2937",
    color: "#10b981",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "monospace",
    overflow: "auto",
    minHeight: "400px",
    margin: 0,
  },
  error: {
    color: "#ef4444",
    fontSize: "12px",
    marginTop: "4px",
  },
  success: {
    color: "#10b981",
    fontSize: "12px",
    marginTop: "4px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  button: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  primaryBtn: {
    background: "#3b82f6",
    color: "white",
  },
  secondaryBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  dangerBtn: {
    background: "#ef4444",
    color: "white",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky" as const,
    bottom: 0,
    background: "white",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 600,
    background: "#fef3c7",
    color: "#92400e",
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

const ProductMetadataJsonEditor = ({ data }: WidgetProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState("")
  const [validationError, setValidationError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const currentJson = JSON.stringify(data.metadata || {}, null, 2)

  const handleOpen = () => {
    setJsonInput(currentJson)
    setValidationError("")
    setMessage(null)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
      setValidationError("")
    } catch (err) {
      setValidationError("Невозможно форматировать: некорректный JSON")
    }
  }

  const handleRestore = () => {
    setJsonInput(currentJson)
    setValidationError("")
    setMessage({ type: "success", text: "Восстановлено из резервной копии" })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async () => {
    // Validate JSON
    let parsedJson
    try {
      parsedJson = JSON.parse(jsonInput)
    } catch (err) {
      setValidationError("Ошибка парсинга JSON. Проверьте синтаксис.")
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Logic to delete keys that were removed in the JSON editor
      // Medusa merges metadata by default, so we must explicitly set removed keys to null
      const currentKeys = Object.keys(data.metadata || {})
      const newKeys = Object.keys(parsedJson)
      const keysToRemove = currentKeys.filter(key => !newKeys.includes(key))
      
      const metadataUpdate = { ...parsedJson }
      keysToRemove.forEach(key => {
        metadataUpdate[key] = null
      })

      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: metadataUpdate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      setMessage({ type: "success", text: "✓ Метаданные успешно обновлены!" })
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button style={styles.trigger} onClick={handleOpen}>
        📝 Редактировать метаданные (JSON)
      </button>

      {/* Modal */}
      {isOpen && (
        <div style={styles.overlay} onClick={handleClose}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={styles.header}>
              <h2 style={styles.title}>JSON Редактор метаданных</h2>
              <button style={styles.closeBtn} onClick={handleClose}>
                ×
              </button>
            </div>

            {/* Body */}
            <div style={styles.body}>
              {/* Left Column: JSON Input */}
              <div style={styles.column}>
                <div>
                  <div style={styles.label}>Новый JSON (вставьте сюда)</div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value)
                      setValidationError("")
                    }}
                    style={{
                      ...styles.textarea,
                      ...(validationError ? styles.textareaError : {}),
                    }}
                    placeholder='{"brand": "Bosch", "category": "Tools"}'
                  />
                  {validationError && <div style={styles.error}>{validationError}</div>}
                </div>

                <div style={styles.buttonGroup}>
                  <button
                    style={{ ...styles.button, ...styles.secondaryBtn }}
                    onClick={handleFormat}
                  >
                    ✨ Форматировать
                  </button>
                  <button
                    style={{ ...styles.button, ...styles.secondaryBtn }}
                    onClick={handleRestore}
                  >
                    ↺ Восстановить
                  </button>
                </div>
              </div>

              {/* Right Column: Current JSON (Backup) */}
              <div style={styles.column}>
                <div>
                  <div style={styles.label}>
                    Текущий JSON (резервная копия)
                    <span style={{ ...styles.badge, marginLeft: "8px" }}>Только чтение</span>
                  </div>
                  <pre style={styles.pre}>{currentJson}</pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
              <div>
                {message && (
                  <span style={message.type === "success" ? styles.success : styles.error}>
                    {message.text}
                  </span>
                )}
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, ...styles.secondaryBtn }}
                  onClick={handleClose}
                >
                  Отмена
                </button>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Сохранение..." : "💾 Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductMetadataJsonEditor
