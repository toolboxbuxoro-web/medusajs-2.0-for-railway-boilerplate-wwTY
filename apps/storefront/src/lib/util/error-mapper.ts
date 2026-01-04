
export const ERROR_MAP: Record<string, string> = {
  failed_to_send_otp: "failed_to_send_otp",
  invalid_code: "invalid_code",
  phone_not_verified: "phone_not_verified",
  "OTP expired or invalid code. Please try again.": "invalid_code",
  "phone_not_verified": "phone_not_verified",
  "too_many_requests": "failed_to_send_otp", // Map rate limit to same friendly message
}

/**
 * Normalizes error message from API or server action.
 * Extracts error code if it's wrapped in JSON or Error object.
 */
export function getErrorCode(error: any): string | null {
  if (!error) return null
  
  let message = typeof error === 'string' ? error : error.message || error.toString()
  
  // Clean up "Error: " prefix if present
  message = message.replace(/^Error: /, "")

  // Try to parse JSON if it looks like JSON
  if (message.trim().startsWith("{")) {
    try {
      const json = JSON.parse(message)
      if (json.error) return json.error
    } catch (e) {
      // ignore parse error
    }
  }

  return message
}
