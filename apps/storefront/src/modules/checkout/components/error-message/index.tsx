import { useTranslations } from "next-intl"
import { getErrorCode, ERROR_MAP } from "@lib/util/error-mapper"

const ErrorMessage = ({ error, 'data-testid': dataTestid }: { error?: string | null, 'data-testid'?: string }) => {
  const t = useTranslations("errors")
  
  if (!error) {
    return null
  }

  const code = getErrorCode(error)
  const mappedKey = code ? (ERROR_MAP[code] || null) : null
  
  // If we have a translation for the mapped key or the code itself
  let message = error // fallback to original
  
  if (mappedKey) {
    try {
      message = t(mappedKey)
    } catch (e) {
      // ignore missing translation
    }
  } else if (code) {
    try {
       // Check if the code itself is a key in translations
       message = t(code)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="pt-2 text-rose-500 text-small-regular" data-testid={dataTestid}>
      <span>{message}</span>
    </div>
  )
}

export default ErrorMessage
