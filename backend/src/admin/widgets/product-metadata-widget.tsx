import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect, useMemo } from "react"

type WidgetProps = {
  data: {
    id: string
    metadata?: Record<string, any>
  }
}

// ============================================================================
// TYPE DEFINITIONS (Shared with storefront)
// ============================================================================

type ProfessionalLevel = "бытовой" | "профессиональный"

interface ProductMetadata {
  brand: string
  category: string
  professional_level: ProfessionalLevel
  pickup_only: boolean
  short_description: string
  features: string[]
  use_cases: string[]
  specifications: Record<string, string>
  seo_title: string
  seo_description: string
  seo_keywords: string[]
}

const EMPTY_METADATA: ProductMetadata = {
  brand: "",
  category: "",
  professional_level: "бытовой",
  pickup_only: true, // Always true - BTS only
  short_description: "",
  features: [],
  use_cases: [],
  specifications: {},
  seo_title: "",
  seo_description: "",
  seo_keywords: [],
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

function validateMetadata(data: ProductMetadata): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.brand?.trim()) {
    errors.brand = "Бренд обязателен"
  }
  if (!data.category?.trim()) {
    errors.category = "Категория обязательна"
  }
  if (!data.short_description?.trim()) {
    errors.short_description = "Краткое описание обязательно"
  }
  if (data.short_description && data.short_description.length > 200) {
    errors.short_description = "Максимум 200 символов"
  }
  if (!data.seo_title?.trim()) {
    errors.seo_title = "SEO заголовок обязателен"
  }
  if (data.seo_title && data.seo_title.length > 60) {
    errors.seo_title = "Максимум 60 символов"
  }
  if (!data.seo_description?.trim()) {
    errors.seo_description = "SEO описание обязательно"
  }
  if (data.seo_description && data.seo_description.length > 160) {
    errors.seo_description = "Максимум 160 символов"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  },
  header: {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 600,
  },
  body: {
    padding: "16px",
  },
  section: {
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f3f4f6",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  fieldGroup: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  textarea: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "60px",
    resize: "vertical" as const,
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    background: "white",
  },
  error: {
    fontSize: "11px",
    color: "#ef4444",
    marginTop: "4px",
  },
  hint: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "4px",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 500,
  },
  readOnlyBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },
  arrayContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "6px",
    marginBottom: "8px",
  },
  arrayItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    background: "#f3f4f6",
    borderRadius: "4px",
    fontSize: "12px",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "0 2px",
    fontSize: "14px",
  },
  addBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    color: "#6b7280",
  },
  specRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    alignItems: "center",
  },
  specInput: {
    flex: 1,
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
  },
  button: {
    padding: "8px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  buttonDisabled: {
    background: "#9ca3af",
    cursor: "not-allowed",
  },
  previewBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  jsonPreview: {
    background: "#1f2937",
    color: "#10b981",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap" as const,
    overflow: "auto",
    maxHeight: "300px",
  },
  message: {
    fontSize: "13px",
    marginLeft: "12px",
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

const ProductMetadataWidget = ({ data }: WidgetProps) => {
  const [formData, setFormData] = useState<ProductMetadata>(EMPTY_METADATA)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Array input states
  const [newFeature, setNewFeature] = useState("")
  const [newUseCase, setNewUseCase] = useState("")
  const [newSpecKey, setNewSpecKey] = useState("")
  const [newSpecValue, setNewSpecValue] = useState("")
  const [newKeyword, setNewKeyword] = useState("")

  // Load existing metadata
  useEffect(() => {
    if (data.metadata) {
      setFormData({
        brand: data.metadata.brand || "",
        category: data.metadata.category || "",
        professional_level: data.metadata.professional_level || "бытовой",
        pickup_only: true, // Always true
        short_description: data.metadata.short_description || "",
        features: Array.isArray(data.metadata.features) ? data.metadata.features : [],
        use_cases: Array.isArray(data.metadata.use_cases) ? data.metadata.use_cases : [],
        specifications: 
          data.metadata.specifications && typeof data.metadata.specifications === "object"
            ? data.metadata.specifications
            : {},
        seo_title: data.metadata.seo_title || "",
        seo_description: data.metadata.seo_description || "",
        seo_keywords: Array.isArray(data.metadata.seo_keywords) ? data.metadata.seo_keywords : [],
      })
    }
  }, [data])

  // Validation
  const validation = useMemo(() => validateMetadata(formData), [formData])

  // Handlers
  const updateField = (field: keyof ProductMetadata, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: "features" | "use_cases" | "seo_keywords", value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }))
    }
  }

  const removeFromArray = (field: "features" | "use_cases" | "seo_keywords", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim(),
        },
      }))
      setNewSpecKey("")
      setNewSpecValue("")
    }
  }

  const removeSpec = (key: string) => {
    setFormData((prev) => {
      const { [key]: _, ...rest } = prev.specifications
      return { ...prev, specifications: rest }
    })
  }

  const handleSave = async () => {
    if (!validation.valid) {
      setMessage({ type: "error", text: "Исправьте ошибки валидации" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            ...data.metadata, // Preserve existing fields
            ...formData,
            pickup_only: true, // Always enforce
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      setMessage({ type: "success", text: "Сохранено ✓" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сохранения" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Контент продукта</h2>
        <span style={{ ...styles.badge, ...styles.readOnlyBadge }}>
          Только самовывоз
        </span>
      </div>

      <div style={styles.body}>
        {/* Core Info Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Основная информация</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Бренд *</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              style={{
                ...styles.input,
                ...(validation.errors.brand ? styles.inputError : {}),
              }}
              placeholder="ALTECO"
            />
            {validation.errors.brand && (
              <div style={styles.error}>{validation.errors.brand}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Категория *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              style={{
                ...styles.input,
                ...(validation.errors.category ? styles.inputError : {}),
              }}
              placeholder="Дрели-шуруповерты"
            />
            {validation.errors.category && (
              <div style={styles.error}>{validation.errors.category}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Уровень</label>
            <select
              value={formData.professional_level}
              onChange={(e) =>
                updateField("professional_level", e.target.value as ProfessionalLevel)
              }
              style={styles.select}
            >
              <option value="бытовой">Бытовой</option>
              <option value="профессиональный">Профессиональный</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Краткое описание *</label>
            <textarea
              value={formData.short_description}
              onChange={(e) => updateField("short_description", e.target.value)}
              style={{
                ...styles.textarea,
                ...(validation.errors.short_description ? styles.inputError : {}),
              }}
              placeholder="45 Н·м, бесщеточный двигатель..."
            />
            <div style={styles.hint}>{formData.short_description.length}/200</div>
            {validation.errors.short_description && (
              <div style={styles.error}>{validation.errors.short_description}</div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Особенности</div>
          <div style={styles.arrayContainer}>
            {formData.features.map((f, i) => (
              <span key={i} style={styles.arrayItem}>
                {f}
                <button style={styles.removeBtn} onClick={() => removeFromArray("features", i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
              placeholder="Добавить особенность..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addToArray("features", newFeature)
                  setNewFeature("")
                }
              }}
            />
            <button
              style={styles.addBtn}
              onClick={() => {
                addToArray("features", newFeature)
                setNewFeature("")
              }}
            >
              + Добавить
            </button>
          </div>
        </div>

        {/* Use Cases Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Применение</div>
          <div style={styles.arrayContainer}>
            {formData.use_cases.map((u, i) => (
              <span key={i} style={styles.arrayItem}>
                {u}
                <button style={styles.removeBtn} onClick={() => removeFromArray("use_cases", i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newUseCase}
              onChange={(e) => setNewUseCase(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
              placeholder="Сверление, монтаж..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addToArray("use_cases", newUseCase)
                  setNewUseCase("")
                }
              }}
            />
            <button
              style={styles.addBtn}
              onClick={() => {
                addToArray("use_cases", newUseCase)
                setNewUseCase("")
              }}
            >
              + Добавить
            </button>
          </div>
        </div>

        {/* Specifications Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Характеристики</div>
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key} style={styles.specRow}>
              <input type="text" value={key} disabled style={{ ...styles.specInput, background: "#f9fafb" }} />
              <input type="text" value={value} disabled style={{ ...styles.specInput, background: "#f9fafb" }} />
              <button style={styles.removeBtn} onClick={() => removeSpec(key)}>
                ×
              </button>
            </div>
          ))}
          <div style={styles.specRow}>
            <input
              type="text"
              value={newSpecKey}
              onChange={(e) => setNewSpecKey(e.target.value)}
              style={styles.specInput}
              placeholder="Название (Напряжение)"
            />
            <input
              type="text"
              value={newSpecValue}
              onChange={(e) => setNewSpecValue(e.target.value)}
              style={styles.specInput}
              placeholder="Значение (21 В)"
            />
            <button style={styles.addBtn} onClick={addSpec}>
              +
            </button>
          </div>
        </div>

        {/* SEO Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SEO</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>SEO Заголовок *</label>
            <input
              type="text"
              value={formData.seo_title}
              onChange={(e) => updateField("seo_title", e.target.value)}
              style={{
                ...styles.input,
                ...(validation.errors.seo_title ? styles.inputError : {}),
              }}
            />
            <div style={styles.hint}>{formData.seo_title.length}/60</div>
            {validation.errors.seo_title && (
              <div style={styles.error}>{validation.errors.seo_title}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>SEO Описание *</label>
            <textarea
              value={formData.seo_description}
              onChange={(e) => updateField("seo_description", e.target.value)}
              style={{
                ...styles.textarea,
                ...(validation.errors.seo_description ? styles.inputError : {}),
              }}
            />
            <div style={styles.hint}>{formData.seo_description.length}/160</div>
            {validation.errors.seo_description && (
              <div style={styles.error}>{validation.errors.seo_description}</div>
            )}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Ключевые слова</label>
            <div style={styles.arrayContainer}>
              {formData.seo_keywords.map((kw, i) => (
                <span key={i} style={styles.arrayItem}>
                  {kw}
                  <button style={styles.removeBtn} onClick={() => removeFromArray("seo_keywords", i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
                placeholder="Ключевое слово..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addToArray("seo_keywords", newKeyword)
                    setNewKeyword("")
                  }
                }}
              />
              <button
                style={styles.addBtn}
                onClick={() => {
                  addToArray("seo_keywords", newKeyword)
                  setNewKeyword("")
                }}
              >
                + Добавить
              </button>
            </div>
          </div>
        </div>

        {/* JSON Preview */}
        {showPreview && (
          <div style={{ marginBottom: "16px" }}>
            <pre style={styles.jsonPreview}>{JSON.stringify(formData, null, 2)}</pre>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleSave}
            disabled={isSaving || !validation.valid}
            style={{
              ...styles.button,
              ...(isSaving || !validation.valid ? styles.buttonDisabled : {}),
            }}
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>

          <button style={styles.previewBtn} onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Скрыть JSON" : "Показать JSON"}
          </button>

          {message && (
            <span
              style={{
                ...styles.message,
                color: message.type === "success" ? "#10b981" : "#ef4444",
              }}
            >
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

export default ProductMetadataWidget
