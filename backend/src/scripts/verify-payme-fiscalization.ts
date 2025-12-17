/**
 * Verifies Payme fiscalization data consistency:
 * - payment_session.amount (sums) -> expected tiyins
 * - sum(detail.items) (tiyins) must equal expected tiyins
 *
 * Run:
 *   PAYME_ORDER_ID=<uuid> npx medusa exec src/scripts/verify-payme-fiscalization.ts
 * Or (auto-picks latest Payme session):
 *   npx medusa exec src/scripts/verify-payme-fiscalization.ts
 */

import { ExecArgs } from "@medusajs/framework/types"

export default async function verifyPaymeFiscalization({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any
  const pgConnection = container.resolve("__pg_connection__") as any

  async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      const res = await pgConnection.raw(
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
      return !!rows?.length
    } catch {
      return false
    }
  }

  const orderIdFromEnv = process.env.PAYME_ORDER_ID

  const sessionRow =
    orderIdFromEnv
      ? (
          await pgConnection.raw(
            `
          SELECT
            ps.id as session_id,
            ps.amount as session_amount,
            ps.currency_code as session_currency,
            ps.data as session_data,
            c.id as cart_id
          FROM payment_session ps
          JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id
          JOIN cart c ON c.id = cpc.cart_id
          WHERE ps.provider_id LIKE '%payme%'
            AND ps.data->>'order_id' = ?
          ORDER BY ps.created_at DESC
          LIMIT 1
        `,
            [orderIdFromEnv]
          )
        )?.rows?.[0]
      : (
          await pgConnection.raw(
            `
          SELECT
            ps.id as session_id,
            ps.amount as session_amount,
            ps.currency_code as session_currency,
            ps.data as session_data,
            c.id as cart_id,
            ps.data->>'order_id' as order_id
          FROM payment_session ps
          JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id
          JOIN cart c ON c.id = cpc.cart_id
          WHERE ps.provider_id LIKE '%payme%'
          ORDER BY ps.created_at DESC
          LIMIT 1
        `
          )
        )?.rows?.[0]

  if (!sessionRow) {
    logger.error(
      orderIdFromEnv
        ? `No Payme payment session found for PAYME_ORDER_ID=${orderIdFromEnv}`
        : "No Payme payment sessions found"
    )
    process.exit(1)
  }

  const orderId =
    orderIdFromEnv || (sessionRow.order_id as string) || "(unknown-order-id)"

  const sessionAmountSums = Number(sessionRow.session_amount)
  const expectedTiyins = Math.round(sessionAmountSums * 100)

  const hasDeletedAt = await hasColumn("cart_line_item", "deleted_at")
  const hasTotal = await hasColumn("cart_line_item", "total")

  // Pull line items (same fields used by PaymeMerchantService)
  const lineItems = (
    await pgConnection.raw(
      `
      SELECT
        cli.id,
        cli.title,
        cli.quantity,
        cli.unit_price,
        ${hasTotal ? "cli.total as line_total," : ""}
        cli.product_title,
        cli.variant_title
      FROM cart_line_item cli
      WHERE cli.cart_id = ?
        ${hasDeletedAt ? "AND cli.deleted_at IS NULL" : ""}
    `,
      [sessionRow.cart_id]
    )
  )?.rows || []

  const sumUnitPriceTimesQtySums = lineItems.reduce(
    (acc: number, li: any) => acc + Number(li.unit_price) * Number(li.quantity),
    0
  )

  // Shipping methods amounts
  const shippingRows = (
    await pgConnection.raw(
      `
      SELECT
        csm.amount as shipping_amount,
        so.name as shipping_name
      FROM cart_shipping_method csm
      LEFT JOIN shipping_option so ON so.id = csm.shipping_option_id
      WHERE csm.cart_id = ?
    `,
      [sessionRow.cart_id]
    )
  )?.rows || []

  const shippingSumSums = shippingRows.reduce(
    (acc: number, r: any) => acc + Number(r.shipping_amount || 0),
    0
  )

  // Compute "fiscal" items sum the same way as PaymeMerchantService currently does
  const lineItemsSumTiyins = lineItems.reduce((acc: number, li: any) => {
    const qty = Math.max(1, Number(li.quantity) || 1)
    const lineTotalSums = hasTotal
      ? Number(li.line_total)
      : Number(li.unit_price) * qty
    return acc + Math.round(lineTotalSums * 100)
  }, 0)
  const shippingSumTiyins = shippingRows.reduce((acc: number, r: any) => {
    const a = Number(r.shipping_amount)
    if (!Number.isFinite(a) || a <= 0) return acc
    return acc + Math.round(a * 100)
  }, 0)

  const fiscalItemsSumTiyins = lineItemsSumTiyins + shippingSumTiyins

  logger.info("=== Payme Fiscalization Verification ===")
  logger.info(`order_id=${orderId}`)
  logger.info(`session_id=${sessionRow.session_id}`)
  logger.info(`cart_id=${sessionRow.cart_id}`)
  logger.info(
    `session.amount=${sessionAmountSums} ${sessionRow.session_currency} -> expected=${expectedTiyins} tiyins`
  )
  logger.info(`cart_line_items=${lineItems.length}`)
  logger.info(
    `sum(unit_price*qty)=${sumUnitPriceTimesQtySums} sums, shippingSum=${shippingSumSums} sums`
  )
  logger.info(
    `fiscalSum(lineItems)=${lineItemsSumTiyins} tiyins, fiscalSum(shipping)=${shippingSumTiyins} tiyins, fiscalTotal=${fiscalItemsSumTiyins} tiyins`
  )

  const diff = expectedTiyins - fiscalItemsSumTiyins
  if (Math.abs(diff) > 1) {
    logger.error(
      `❌ MISMATCH: expected=${expectedTiyins} tiyins, fiscalTotal=${fiscalItemsSumTiyins} tiyins, diff=${diff}`
    )

    // Print first N line items for quick diagnosis (no secrets)
    const sample = lineItems.slice(0, 20).map((li: any) => ({
      id: li.id,
      title: li.product_title || li.title,
      variant: li.variant_title || null,
      qty: Number(li.quantity),
      unit_price: Number(li.unit_price),
      line_total_sums: Number(li.unit_price) * Number(li.quantity),
    }))
    logger.error(`Line items sample (first ${sample.length}):`)
    logger.error(JSON.stringify(sample, null, 2))

    process.exit(1)
  }

  logger.info("✅ OK: fiscal items sum matches Payme amount")
}


