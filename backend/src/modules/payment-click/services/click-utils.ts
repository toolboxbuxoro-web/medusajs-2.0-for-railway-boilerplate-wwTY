import crypto from "crypto"

/**
 * Click signature formulas (docs.click.uz /click-api-request):
 * - Prepare: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
 * - Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 */
export function md5Hex(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex")
}

export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

export function verifyClickPrepareSignature(params: {
  click_trans_id: string
  service_id: string
  secret_key: string
  merchant_trans_id: string
  amount: string
  action: string
  sign_time: string
  sign_string: string
}): boolean {
  const computed = md5Hex(
    params.click_trans_id +
      params.service_id +
      params.secret_key +
      params.merchant_trans_id +
      params.amount +
      params.action +
      params.sign_time
  )
  return computed.toLowerCase() === params.sign_string.toLowerCase()
}

export function verifyClickCompleteSignature(params: {
  click_trans_id: string
  service_id: string
  secret_key: string
  merchant_trans_id: string
  merchant_prepare_id: string
  amount: string
  action: string
  sign_time: string
  sign_string: string
}): boolean {
  const computed = md5Hex(
    params.click_trans_id +
      params.service_id +
      params.secret_key +
      params.merchant_trans_id +
      params.merchant_prepare_id +
      params.amount +
      params.action +
      params.sign_time
  )
  return computed.toLowerCase() === params.sign_string.toLowerCase()
}

/**
 * Parse Click amount string in sums (format N or N.NN) into a comparable bigint.
 * IMPORTANT: Medusa stores amounts in SUMS. Click sends amounts in SUMS.
 * No conversion needed - we just parse the integer part.
 */
export function parseUzsAmountToTiyin(amount: string): bigint | null {
  const norm = normalizeString(amount).replace(",", ".")
  if (!norm) return null
  if (!/^\d+(\.\d+)?$/.test(norm)) return null

  // Just take the integer part (sums)
  const [intPart] = norm.split(".")
  
  try {
    return BigInt(intPart)
  } catch {
    return null
  }
}

export function formatTiyinToUzsAmount(amountSums: number): string {
  // IMPORTANT: Despite the name, Medusa 2.0 stores amounts in SUMS (standard units), NOT tiyins.
  // Click expects sums with 2 decimals. We just format the number, no division needed.
  // (Payme multiplies by 100 because Payme API expects tiyins, but Click expects sums)
  const v = Math.round(Number(amountSums))
  return v.toFixed(2)
}















