import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

type Body = {
  cart_id: string
  shipping_option_id: string
  amount: number
}

const columnCache: Record<string, boolean> = {}

async function hasColumnCached(pg: any, tableName: string, columnName: string): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}`
  if (cacheKey in columnCache) return columnCache[cacheKey]

  try {
    const res = await pg.raw(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
      [tableName, columnName]
    )
    const rows = res?.rows || res || []
    columnCache[cacheKey] = !!rows?.length
    return columnCache[cacheKey]
  } catch {
    return false
  }
}

/**
 * BTS shipping option can be configured without a price in Medusa admin.
 * Medusa then refuses to attach it to cart: "Shipping options ... do not have a price".
 *
 * This endpoint force-attaches a shipping method row to the cart with a concrete amount
 * (taken from storefront-calculated BTS estimate), bypassing shipping option price validation.
 * 
 * Uses direct SQL INSERT to bypass Medusa's validation, then triggers cart recalculation
 * via Cart Module to ensure totals are updated correctly.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const { cart_id, shipping_option_id, amount } = (req.body || {}) as Partial<Body>

  const startTime = Date.now()
  logger?.info?.(`[store/bts/shipping-method] Processing request for cart ${cart_id}, option ${shipping_option_id}, amount ${amount}`)

  if (!cart_id || !shipping_option_id || typeof amount !== "number") {
    return res.status(400).json({ error: "cart_id, shipping_option_id, amount are required" })
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: "amount must be a non-negative number" })
  }

  try {
    const pg = req.scope.resolve("__pg_connection__")
    const cartModule = req.scope.resolve(Modules.CART) as any

    // Remove any existing shipping methods for this cart (single-method model).
    await pg.raw(`DELETE FROM cart_shipping_method WHERE cart_id = ?`, [cart_id])

    const cols = {
      id: await hasColumnCached(pg, "cart_shipping_method", "id"),
      cart_id: await hasColumnCached(pg, "cart_shipping_method", "cart_id"),
      shipping_option_id: await hasColumnCached(pg, "cart_shipping_method", "shipping_option_id"),
      name: await hasColumnCached(pg, "cart_shipping_method", "name"),
      amount: await hasColumnCached(pg, "cart_shipping_method", "amount"),
      raw_amount: await hasColumnCached(pg, "cart_shipping_method", "raw_amount"),
      currency_code: await hasColumnCached(pg, "cart_shipping_method", "currency_code"),
      data: await hasColumnCached(pg, "cart_shipping_method", "data"),
      created_at: await hasColumnCached(pg, "cart_shipping_method", "created_at"),
      updated_at: await hasColumnCached(pg, "cart_shipping_method", "updated_at"),
    }

    // Determine cart currency if the column exists.
    let currencyCode: string | null = null
    if (cols.currency_code) {
      try {
        const r = await pg.raw(`SELECT currency_code FROM cart WHERE id = ? LIMIT 1`, [cart_id])
        const rows = r?.rows || r || []
        currencyCode = rows?.[0]?.currency_code || null
      } catch (err: any) {
        logger?.warn?.(`[store/bts/shipping-method] Failed to get cart currency: ${err.message}`)
        currencyCode = null
      }
    }

    // Get shipping option name if needed
    let shippingOptionName = "BTS Delivery"
    if (cols.name && shipping_option_id) {
      try {
        const optionResult = await pg.raw(`SELECT name FROM shipping_option WHERE id = ? LIMIT 1`, [shipping_option_id])
        const optionRows = optionResult?.rows || optionResult || []
        if (optionRows.length > 0 && optionRows[0]?.name) {
          shippingOptionName = optionRows[0].name
        }
      } catch (err: any) {
        logger?.warn?.(`[store/bts/shipping-method] Failed to get shipping option name: ${err.message}`)
      }
    }

    const id = `csm_${crypto.randomUUID().replace(/-/g, "")}`
    const now = new Date()

    const insertCols: string[] = []
    const placeholders: string[] = []
    const values: any[] = []

    if (cols.id) {
      insertCols.push("id")
      placeholders.push("?")
      values.push(id)
    }
    if (cols.cart_id) {
      insertCols.push("cart_id")
      placeholders.push("?")
      values.push(cart_id)
    }
    if (cols.name) {
      insertCols.push("name")
      placeholders.push("?")
      values.push(shippingOptionName)
    }
    if (cols.shipping_option_id) {
      insertCols.push("shipping_option_id")
      placeholders.push("?")
      values.push(shipping_option_id)
    }
    if (cols.amount) {
      insertCols.push("amount")
      placeholders.push("?")
      values.push(amount)
    }
    if (cols.raw_amount) {
      insertCols.push("raw_amount")
      placeholders.push("?")
      // Medusa 2.0 BigNumber in DB expects { "value": "..." }
      values.push({
        value: amount.toString()
      })
    }
    if (cols.currency_code) {
      insertCols.push("currency_code")
      placeholders.push("?")
      values.push((currencyCode || "uzs").toLowerCase())
    }
    if (cols.data) {
      insertCols.push("data")
      placeholders.push("?")
      values.push(JSON.stringify({ source: "bts_estimate" }))
    }
    if (cols.created_at) {
      insertCols.push("created_at")
      placeholders.push("?")
      values.push(now)
    }
    if (cols.updated_at) {
      insertCols.push("updated_at")
      placeholders.push("?")
      values.push(now)
    }

    if (!insertCols.length) {
      return res.status(500).json({ error: "cart_shipping_method schema not detected" })
    }

    // Insert shipping method directly (bypassing Medusa validation)
    await pg.raw(
      `INSERT INTO cart_shipping_method (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")})`,
      values
    )

    // Trigger cart recalculation via Cart Module to update totals
    try {
      await cartModule.updateCarts(cart_id, {})
      logger?.info?.(`[store/bts/shipping-method] Cart ${cart_id} recalculated successfully in ${Date.now() - startTime}ms`)
    } catch (recalcError: any) {
      logger?.warn?.(`[store/bts/shipping-method] Cart recalculation warning for ${cart_id}: ${recalcError?.message || recalcError}`)
    }

    return res.json({ success: true, duration: Date.now() - startTime })
  } catch (e: any) {
    logger?.error?.(`[store/bts/shipping-method] Fatal error for cart ${cart_id} after ${Date.now() - startTime}ms: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}


