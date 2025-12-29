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
 * Convert Click amount string in sums (format N or N.NN) into minor units (tiyin) as bigint.
 * This is used only for internal validation; signature verification must use the original string.
 */
export function parseUzsAmountToTiyin(amount: string): bigint | null {
  const norm = normalizeString(amount).replace(",", ".")
  if (!norm) return null
  if (!/^\d+(\.\d+)?$/.test(norm)) return null

  const [i, f = ""] = norm.split(".")
  const frac2 = (f + "00").slice(0, 2)

  try {
    return BigInt(i) * 100n + BigInt(frac2)
  } catch {
    return null
  }
}

export function formatTiyinToUzsAmount(amountTiyin: number): string {
  // Medusa amounts are in minor units; Click expects sums with 2 decimals.
  const v = Math.round(Number(amountTiyin))
  const sums = v / 100
  return sums.toFixed(2)
}














