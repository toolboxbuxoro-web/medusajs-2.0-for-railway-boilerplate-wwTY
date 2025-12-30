export function normalizeUzPhone(input: string): string | null {
  if (!input) return null
  // Keep digits only
  const digits = input.replace(/\D/g, "")

  // Accept:
  // - 998XXXXXXXXX (12 digits)
  // - +998XXXXXXXXX (handled above)
  // - 0XXXXXXXXX / XXXXXXXXX (local 9 digits) => assume Uzbekistan, prefix 998
  if (digits.startsWith("998") && digits.length === 12) {
    return digits
  }

  // Local format (9 digits) e.g. 901234567
  if (digits.length === 9) {
    return `998${digits}`
  }

  // Local with leading 0 (10 digits) e.g. 0901234567
  if (digits.length === 10 && digits.startsWith("0")) {
    return `998${digits.slice(1)}`
  }

  return null
}















