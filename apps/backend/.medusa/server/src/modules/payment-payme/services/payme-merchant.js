"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymeMerchantService = exports.PaymeError = exports.PaymeErrorCodes = void 0;
const utils_1 = require("@medusajs/framework/utils");
var PaymeErrorCodes;
(function (PaymeErrorCodes) {
    PaymeErrorCodes[PaymeErrorCodes["INTERNAL_ERROR"] = -32400] = "INTERNAL_ERROR";
    PaymeErrorCodes[PaymeErrorCodes["INSUFFICIENT_PRIVILEGE"] = -32504] = "INSUFFICIENT_PRIVILEGE";
    PaymeErrorCodes[PaymeErrorCodes["INVALID_JSON_RPC_OBJECT"] = -32600] = "INVALID_JSON_RPC_OBJECT";
    PaymeErrorCodes[PaymeErrorCodes["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    PaymeErrorCodes[PaymeErrorCodes["INVALID_AMOUNT"] = -31001] = "INVALID_AMOUNT";
    PaymeErrorCodes[PaymeErrorCodes["TRANSACTION_NOT_FOUND"] = -31003] = "TRANSACTION_NOT_FOUND";
    PaymeErrorCodes[PaymeErrorCodes["INVALID_ACCOUNT"] = -31050] = "INVALID_ACCOUNT";
    PaymeErrorCodes[PaymeErrorCodes["COULD_NOT_CANCEL"] = -31007] = "COULD_NOT_CANCEL";
    PaymeErrorCodes[PaymeErrorCodes["COULD_NOT_PERFORM"] = -31008] = "COULD_NOT_PERFORM";
    PaymeErrorCodes[PaymeErrorCodes["ORDER_ALREADY_PAID"] = -31099] = "ORDER_ALREADY_PAID";
})(PaymeErrorCodes || (exports.PaymeErrorCodes = PaymeErrorCodes = {}));
/**
 * Custom error class for Payme JSON-RPC errors.
 */
class PaymeError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
exports.PaymeError = PaymeError;
/**
 * Service for handling Payme Merchant API JSON-RPC requests.
 * Follows the standard Payme protocol for transaction lifecycle.
 */
class PaymeMerchantService {
    logger_;
    container_;
    constructor({ logger, container }) {
        this.logger_ = logger;
        this.container_ = container;
    }
    async hasColumn(pgConnection, tableName, columnName) {
        try {
            const res = await pgConnection.raw(`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
      `, [tableName, columnName]);
            const rows = res?.rows || res || [];
            return !!rows?.length;
        }
        catch {
            return false;
        }
    }
    /**
     * Route incoming JSON-RPC method calls to the appropriate handler.
     */
    async handleRequest(method, params) {
        switch (method) {
            case "CheckPerformTransaction":
                return this.checkPerformTransaction(params);
            case "CreateTransaction":
                return this.createTransaction(params);
            case "PerformTransaction":
                return this.performTransaction(params);
            case "CancelTransaction":
                return this.cancelTransaction(params);
            case "CheckTransaction":
                return this.checkTransaction(params);
            case "GetStatement":
                return this.getStatement(params);
            default:
                throw new PaymeError(PaymeErrorCodes.METHOD_NOT_FOUND, "Method not found");
        }
    }
    /**
     * Find Payme payment session by order_id stored in session data.
     * Uses raw SQL to query by JSON field since remoteQuery filters don't work reliably.
     * @param orderId - The order_id (cart_id) passed from Payme.
     */
    async getPaymentSessionByOrderId(orderId) {
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
            // Query payment_session by data->>'order_id'
            const result = await pgConnection.raw(`
        SELECT 
          ps.id,
          ps.amount,
          ps.currency_code,
          ps.status,
          ps.data,
          ps.payment_collection_id,
          c.id as cart_id,
          c.completed_at
        FROM payment_session ps
        JOIN cart_payment_collection cpc ON cpc.payment_collection_id = ps.payment_collection_id
        JOIN cart c ON c.id = cpc.cart_id
        WHERE ps.data->>'order_id' = ?
          AND ps.provider_id LIKE '%payme%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [orderId]);
            const rows = result?.rows || result || [];
            const session = rows[0];
            if (!session) {
                this.logger_.warn(`[PaymeMerchant] No payment session found for order_id: ${orderId}`);
                return null;
            }
            this.logger_.info(`[PaymeMerchant] Found session ${session.id} for order_id ${orderId}`);
            return session;
        }
        catch (error) {
            this.logger_.error(`[PaymeMerchant] Error querying payment session: ${error}`);
            return null;
        }
    }
    /**
     * Find payment session by Medusa Session ID.
     * @param id - Medusa Session ID (returned from CreateTransaction).
     */
    async findSession(id) {
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        try {
            const session = await paymentModule.retrievePaymentSession(id);
            return session;
        }
        catch {
            return null;
        }
    }
    /**
     * Find payment session by Payme transaction ID stored in session.data.
     * @param paymeTransactionId - Payme's transaction ID.
     */
    async findSessionByPaymeTransactionId(paymeTransactionId) {
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
            const result = await pgConnection.raw(`
        SELECT id, amount, currency_code, status, data, payment_collection_id
        FROM payment_session
        WHERE data->>'payme_transaction_id' = ?
          AND provider_id LIKE '%payme%'
        ORDER BY created_at DESC
        LIMIT 1
      `, [paymeTransactionId]);
            const rows = result?.rows || result || [];
            return rows[0] || null;
        }
        catch (error) {
            this.logger_.error(`[PaymeMerchant] Error finding session by payme_transaction_id: ${error}`);
            return null;
        }
    }
    /**
     * Fetch cart items for fiscalization (detail object).
     * Returns items with title, price, count, MXIK code for Payme receipt.
     * INCLUDES shipping costs to ensure sum matches transaction total.
     * MXIK is taken from product.metadata.mxik_code only.
     * @param cartId - Cart ID to fetch items for.
     * @param expectedTotal - Expected total in tiyins to validate sum matches.
     */
    async getCartItemsForFiscalization(cartId, expectedTotal) {
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
            const hasDeletedAt = await this.hasColumn(pgConnection, "cart_line_item", "deleted_at");
            const hasTotal = await this.hasColumn(pgConnection, "cart_line_item", "total");
            // Query cart line items with product metadata for MXIK code
            const whereDeleted = hasDeletedAt ? "AND cli.deleted_at IS NULL" : "";
            const totalSelect = hasTotal ? ", cli.total as line_total" : "";
            const lineItemsResult = await pgConnection.raw(`
        SELECT 
          cli.id,
          cli.title,
          cli.quantity,
          cli.unit_price,
          ${hasTotal ? "cli.total as line_total," : ""}
          cli.product_title,
          cli.variant_title,
          cli.product_id,
          p.metadata as product_metadata
        FROM cart_line_item cli
        LEFT JOIN product p ON p.id = cli.product_id
        WHERE cli.cart_id = ?
          ${whereDeleted}
      `, [cartId]);
            const rows = lineItemsResult?.rows || lineItemsResult || [];
            // Build items array for fiscalization
            const items = [];
            const itemsWithoutMxik = [];
            for (const row of rows) {
                // Use product_title + variant_title if available, fallback to title
                const title = row.product_title
                    ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
                    : (row.title || "Товар");
                // Get MXIK code from product metadata only - NO DEFAULT!
                const productMetadata = typeof row.product_metadata === 'string'
                    ? JSON.parse(row.product_metadata)
                    : (row.product_metadata || {});
                const mxikCode = productMetadata.mxik_code;
                // If product doesn't have MXIK code, track it for error
                if (!mxikCode) {
                    itemsWithoutMxik.push(title);
                }
                const qty = Math.max(1, Number(row.quantity) || 1);
                // Prefer line_total (if available) because it reflects discounts/promotions.
                // Fallback to unit_price * qty.
                const lineTotalSums = hasTotal
                    ? Number(row.line_total)
                    : Number(row.unit_price) * qty;
                // Convert sums -> tiyins.
                const lineTotalTiyins = Math.round(lineTotalSums * 100);
                // Payme expects per-unit price + count. Split totals across qty and keep remainder on the first unit.
                const unit = Math.floor(lineTotalTiyins / qty);
                const remainder = lineTotalTiyins - unit * qty;
                const item = {
                    title: title.substring(0, 128), // Payme limit: 128 chars
                    price: unit + remainder, // Price per unit in tiyin
                    count: qty,
                    code: mxikCode || "MISSING",
                    units: "", // Defensive default to prevent .replace() crash
                    vat_percent: 12,
                    package_code: productMetadata.package_code || "2009" // Default to '2009' (Piece) if not specified
                };
                items.push(item);
            }
            // If any items are missing MXIK code, throw error - they cannot be sold!
            if (itemsWithoutMxik.length > 0) {
                const errorMsg = `Товары без MXIK кода не могут быть проданы: ${itemsWithoutMxik.join(', ')}`;
                this.logger_.error(`[PaymeMerchant] ${errorMsg}`);
                throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, errorMsg);
            }
            // Query shipping costs from cart
            const shippingResult = await pgConnection.raw(`
        SELECT 
          csm.amount as shipping_amount,
          so.name as shipping_name
        FROM cart_shipping_method csm
        LEFT JOIN shipping_option so ON so.id = csm.shipping_option_id
        WHERE csm.cart_id = ?
      `, [cartId]);
            const shippingRows = shippingResult?.rows || shippingResult || [];
            // Add shipping as a separate item if present
            // MXIK for delivery/logistics services: "10105001001000000"
            const SHIPPING_MXIK_CODE = "10105001001000000";
            for (const shipping of shippingRows) {
                const shippingAmount = Number(shipping.shipping_amount);
                if (shippingAmount > 0) {
                    items.push({
                        title: (shipping.shipping_name || "Доставка").substring(0, 128),
                        price: Math.round(shippingAmount * 100), // Convert to tiyin
                        count: 1,
                        code: SHIPPING_MXIK_CODE,
                        units: "", // Defensive default
                        vat_percent: 12,
                        package_code: "2009" // Service
                    });
                }
            }
            // Calculate sum of all items
            const itemsSum = items.reduce((sum, item) => sum + (item.price * item.count), 0);
            // #region payme debug
            if (true) {
                try {
                    const rawUnitPrices = rows
                        .map((r) => Number(r.unit_price))
                        .filter((n) => Number.isFinite(n));
                    const rawMin = rawUnitPrices.length ? Math.min(...rawUnitPrices) : null;
                    const rawMax = rawUnitPrices.length ? Math.max(...rawUnitPrices) : null;
                    const shippingAmounts = shippingRows
                        .map((s) => Number(s.shipping_amount))
                        .filter((n) => Number.isFinite(n) && n > 0);
                    const sample = items.slice(0, 3).map((it) => ({
                        price: it?.price,
                        count: it?.count,
                        vat_percent: it?.vat_percent,
                        package_code: it?.package_code,
                        codeLen: typeof it?.code === "string" ? it.code.length : null,
                    }));
                    // Force log this for debugging production issue
                    this.logger_.info(`[PaymeMerchant][FiscalDebug] cart=${cartId} expected=${expectedTotal ?? null} items=${items.length} itemsSum=${itemsSum} rawUnitPrice[min,max]=${rawMin},${rawMax} shippingAmounts=${shippingAmounts.join(",") || "none"} sample=${JSON.stringify(items)}`);
                }
                catch (_e) { }
            }
            // #endregion payme debug
            // If there's a mismatch between items sum and expected total, log it
            if (expectedTotal && Math.abs(itemsSum - expectedTotal) > 1) {
                this.logger_.warn(`[PaymeMerchant] Fiscalization sum mismatch: items=${itemsSum}, expected=${expectedTotal}, diff=${expectedTotal - itemsSum}`);
            }
            /**
             * IMPORTANT:
             * Payme validates fiscalization data. If `detail.items` sum doesn't match `amount`,
             * Payme shows "Неправильные фискальные данные" and blocks the payment UI.
             *
             * Cart line items can diverge from the payment amount due to promotions, rounding,
             * or because `unit_price` isn't the final payable amount.
             *
             * To ensure payment can proceed, fall back to a single fiscal item equal to the
             * expected total if we detect a mismatch.
             */
            if (expectedTotal && Math.abs(itemsSum - expectedTotal) > 1) {
                // If mismatch is small, adjust the last item price to make sums match (keeps itemization).
                const diff = expectedTotal - itemsSum;
                if (items.length > 0 && Math.abs(diff) <= Math.max(100, Math.floor(expectedTotal * 0.02))) {
                    const last = items[items.length - 1];
                    const newPrice = Number(last.price) + diff; // count is 1 for remainder-bearing items? count may be >1.
                    if (Number.isFinite(newPrice) && newPrice > 0) {
                        last.price = newPrice;
                        this.logger_.warn(`[PaymeMerchant] Adjusted last fiscal item by diff=${diff} to match expected total`);
                        return items;
                    }
                }
                // If significant mismatch, throw error - cannot proceed without proper fiscal items
                const errorMsg = `Сумма товаров (${itemsSum}) не совпадает с суммой заказа (${expectedTotal}). Разница: ${Math.abs(diff)} тийин`;
                this.logger_.error(`[PaymeMerchant] ${errorMsg}`);
                throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, errorMsg);
            }
            this.logger_.info(`[PaymeMerchant] Prepared ${items.length} items for fiscalization, sum=${itemsSum} tiyin`);
            return items;
        }
        catch (error) {
            this.logger_.error(`[PaymeMerchant] Error fetching cart items: ${error}`);
            return [];
        }
    }
    // ─────────────────────────────────────────────────────────────────────────────
    // Payme JSON-RPC Method Handlers
    // ─────────────────────────────────────────────────────────────────────────────
    /**
     * CheckPerformTransaction: Validate that a payment can be performed.
     * Called by Payme before CreateTransaction.
     */
    async checkPerformTransaction(params) {
        const { amount, account } = params;
        const orderId = account?.order_id;
        this.logger_.info(`[PaymeMerchant] CheckPerformTransaction: order_id=${orderId}, amount=${amount}`);
        if (!orderId) {
            throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order ID is missing");
        }
        const session = await this.getPaymentSessionByOrderId(orderId);
        if (!session) {
            throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found");
        }
        // Check if order is already paid (cart completed)
        if (session.completed_at) {
            throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already completed");
        }
        // Check if already paid via payme_state
        const sessionData = typeof session.data === 'string'
            ? JSON.parse(session.data)
            : (session.data || {});
        if (sessionData.payme_state === 2) {
            throw new PaymeError(PaymeErrorCodes.ORDER_ALREADY_PAID, "Order already paid");
        }
        // Amount validation - use session.amount as source of truth (convert to tiyins)
        const expectedAmount = Math.round(Number(session.amount) * 100);
        if (expectedAmount <= 0) {
            throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, "Invalid amount");
        }
        // Allow small difference (e.g. 100 tiyin = 1 som) for float rounding issues
        if (Math.abs(expectedAmount - amount) > 100) {
            throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`);
        }
        // Fetch cart items for fiscalization (pass expected amount for validation)
        const items = await this.getCartItemsForFiscalization(session.cart_id, expectedAmount);
        // #region payme debug
        if (process.env.PAYME_FISCAL_DEBUG === "true") {
            try {
                const payload = {
                    orderId,
                    cartId: session.cart_id,
                    sessionAmountRaw: session.amount,
                    sessionCurrency: session.currency_code,
                    amountParam: amount,
                    expectedAmount,
                    itemsCount: items?.length || 0,
                };
                this.logger_.info(`[PaymeMerchant][FiscalDebug] CheckPerform snapshot ${JSON.stringify(payload)}`);
            }
            catch (_e) { }
        }
        // #endregion payme debug
        this.logger_.info(`[PaymeMerchant] CheckPerformTransaction SUCCESS for order_id=${orderId}, items=${items.length}`);
        // Return with detail object for fiscalization (чекопечать)
        return {
            allow: true,
            account: account || { order_id: orderId }, // Echo account for defensive UI logic
            detail: {
                receipt_type: 0, // 0 = sale, 1 = return
                shipping: {
                    title: "Самовывоз", // Default title for BTS-only (pickup)
                    price: 0,
                    address: "" // Explicit empty string for address to prevent .replace() crash
                },
                customer: {
                    name: "",
                    phone: "",
                    address: ""
                },
                items: items
            }
        };
    }
    /**
     * CreateTransaction: Create a new payment transaction.
     * Called by Payme after successful CheckPerformTransaction.
     */
    async createTransaction(params) {
        const { id, time, amount, account } = params;
        const orderId = account?.order_id;
        this.logger_.info(`[PaymeMerchant] CreateTransaction: order_id=${orderId}, payme_id=${id}, amount=${amount}`);
        // Timeout check (max 12 hours)
        const TIMEOUT_MS = 12 * 60 * 60 * 1000;
        if (Date.now() - time > TIMEOUT_MS) {
            throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction timeout: older than 12 hours");
        }
        const session = await this.getPaymentSessionByOrderId(orderId);
        if (!session) {
            throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Order not found");
        }
        // Parse session data
        const currentData = typeof session.data === 'string'
            ? JSON.parse(session.data)
            : (session.data || {});
        // Idempotency: If the same transaction ID exists, return its state
        if (currentData.payme_transaction_id === id) {
            return {
                create_time: currentData.payme_create_time,
                transaction: session.id,
                state: currentData.payme_state,
                account: account || { order_id: orderId } // Echo account
            };
        }
        // If a DIFFERENT transaction already exists (pending or completed), block
        if (currentData.payme_transaction_id && currentData.payme_state >= 1) {
            // State 1 = pending, State 2 = completed - both should block new transactions
            // Error code must be in range -31050 to -31099 per Payme spec
            throw new PaymeError(-31051, "Another transaction is in progress for this order");
        }
        // Amount validation using session.amount (convert to tiyins)
        const expectedAmount = Math.round(Number(session.amount) * 100);
        if (Math.abs(expectedAmount - amount) > 100) {
            throw new PaymeError(PaymeErrorCodes.INVALID_AMOUNT, `Amount mismatch: expected ${expectedAmount}, got ${amount}`);
        }
        // Create or overwrite transaction
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        const newData = {
            ...currentData,
            payme_transaction_id: id,
            payme_create_time: time,
            payme_state: 1,
            cart_id: session.cart_id // Save cart ID for PerformTransaction
        };
        await paymentModule.updatePaymentSession({
            id: session.id,
            amount: Number(session.amount),
            currency_code: session.currency_code || "uzs",
            data: newData
        });
        this.logger_.info(`[PaymeMerchant] CreateTransaction SUCCESS: session_id=${session.id}`);
        return {
            create_time: time,
            transaction: session.id, // Return Medusa Session ID for subsequent calls
            state: 1,
            account: account || { order_id: orderId } // Echo account
        };
    }
    /**
     * PerformTransaction: Finalize a payment.
     * The `id` in params is our Session ID (returned from CreateTransaction).
     */
    async performTransaction(params) {
        const { id } = params;
        this.logger_.info(`[PaymeMerchant] PerformTransaction: id=${id}`);
        // Try finding by Medusa session ID first, fallback to Payme transaction ID
        let session = await this.findSession(id);
        if (!session) {
            session = await this.findSessionByPaymeTransactionId(id);
        }
        if (!session) {
            throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found");
        }
        const currentData = typeof session.data === 'string'
            ? JSON.parse(session.data)
            : (session.data || {});
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        // Idempotency: If already performed, return success
        if (currentData.payme_state === 2) {
            return {
                transaction: session.id,
                perform_time: currentData.payme_perform_time,
                state: 2
            };
        }
        // Can only perform a transaction in state 1 (created)
        if (currentData.payme_state !== 1) {
            throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction not in created state");
        }
        // Timeout check (12 hours from creation)
        const TIMEOUT_MS = 12 * 60 * 60 * 1000;
        if (Date.now() - currentData.payme_create_time > TIMEOUT_MS) {
            throw new PaymeError(PaymeErrorCodes.COULD_NOT_PERFORM, "Transaction timeout: cannot perform after 12 hours");
        }
        // Perform transaction - update state BEFORE cart completion
        const performTime = Date.now();
        const newData = {
            ...currentData,
            payme_state: 2,
            payme_perform_time: performTime,
            transaction_id: currentData.payme_transaction_id // For Medusa tracking
        };
        // Update session data FIRST so authorizePayment check passes
        await paymentModule.updatePaymentSession({
            id: session.id,
            amount: session.amount || currentData.amount || 0,
            currency_code: session.currency_code || "uzs",
            data: newData
        });
        this.logger_.info(`[PaymeMerchant] Updated session ${session.id} with payme_state=2`);
        // Attempt to complete the cart in Medusa using the workflow
        const cartId = currentData.cart_id;
        if (cartId) {
            try {
                // In Medusa 2.0, cart completion is done via workflow, not module method
                // Import and run the completeCartWorkflow
                const { completeCartWorkflow } = await import("@medusajs/medusa/core-flows");
                this.logger_.info(`[PaymeMerchant] Running completeCartWorkflow for cart ${cartId}`);
                const workflowResult = await completeCartWorkflow(this.container_).run({
                    input: { id: cartId }
                });
                const orderId = workflowResult?.result?.id;
                if (orderId) {
                    // Copy cart metadata to order (for quick order credentials SMS)
                    try {
                        const pgConnection = this.container_.resolve("__pg_connection__");
                        // Get cart metadata
                        const cartResult = await pgConnection.raw(`SELECT metadata FROM cart WHERE id = $1`, [cartId]);
                        const cartMetadata = cartResult?.rows?.[0]?.metadata;
                        if (cartMetadata) {
                            const meta = typeof cartMetadata === 'string' ? JSON.parse(cartMetadata) : cartMetadata;
                            // If cart has quick order data, copy to order
                            if (meta?.is_quick_order || meta?.tmp_generated_password) {
                                await pgConnection.raw(`UPDATE "order" SET metadata = COALESCE(metadata, '{}')::jsonb || $1::jsonb WHERE id = $2`, [JSON.stringify({
                                        is_quick_order: meta.is_quick_order,
                                        is_new_customer: meta.is_new_customer,
                                        tmp_generated_password: meta.tmp_generated_password,
                                    }), orderId]);
                                this.logger_.info(`[PaymeMerchant] Copied quick order metadata from cart to order ${orderId}`);
                            }
                        }
                    }
                    catch (metaErr) {
                        this.logger_.warn(`[PaymeMerchant] Failed to copy cart metadata to order: ${metaErr.message}`);
                    }
                    // Persist the created order id so storefront can redirect to /order/confirmed/:id
                    const dataWithOrder = {
                        ...newData,
                        medusa_order_id: orderId,
                    };
                    await paymentModule.updatePaymentSession({
                        id: session.id,
                        amount: session.amount || currentData.amount || 0,
                        currency_code: session.currency_code || "uzs",
                        data: dataWithOrder,
                    });
                    this.logger_.info(`[PaymeMerchant] Completed cart ${cartId} -> order ${orderId} (saved to session ${session.id})`);
                }
                else {
                    this.logger_.warn(`[PaymeMerchant] completeCartWorkflow succeeded but no order ID returned for cart ${cartId}`);
                }
            }
            catch (e) {
                this.logger_.error(`[PaymeMerchant] Failed to complete cart ${cartId}: ${e?.message || e}`);
                // We still proceed to confirm the transaction to Payme to avoid desync
            }
        }
        // Session already updated above with payme_state=2
        return {
            transaction: session.id,
            perform_time: performTime,
            state: 2
        };
    }
    /**
     * CancelTransaction: Cancel a transaction.
     */
    async cancelTransaction(params) {
        const { id, reason } = params;
        this.logger_.info(`[PaymeMerchant] CancelTransaction: id=${id}, reason=${reason}`);
        // Try finding by Medusa session ID first, fallback to Payme transaction ID
        let session = await this.findSession(id);
        if (!session) {
            session = await this.findSessionByPaymeTransactionId(id);
        }
        if (!session) {
            throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found");
        }
        const currentData = typeof session.data === 'string'
            ? JSON.parse(session.data)
            : (session.data || {});
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        const cancelTime = Date.now();
        let newState;
        if (currentData.payme_state === 1) {
            // Cancel before performance
            newState = -1;
        }
        else if (currentData.payme_state === 2) {
            // Cancel after performance (refund)
            newState = -2;
        }
        else {
            // Already cancelled, return current state
            return {
                transaction: session.id,
                cancel_time: currentData.payme_cancel_time || cancelTime,
                state: currentData.payme_state
            };
        }
        await paymentModule.updatePaymentSession({
            id: session.id,
            amount: session.amount,
            currency_code: session.currency_code || "uzs",
            data: {
                ...currentData,
                payme_state: newState,
                payme_cancel_time: cancelTime,
                payme_cancel_reason: reason
            }
        });
        return {
            transaction: session.id,
            cancel_time: cancelTime,
            state: newState
        };
    }
    /**
     * CheckTransaction: Get the status of a transaction.
     * Note: Payme sends their transaction ID, not our session ID.
     */
    async checkTransaction(params) {
        const { id } = params;
        this.logger_.info(`[PaymeMerchant] CheckTransaction: payme_id=${id}`);
        // First try to find by Payme transaction ID (stored in session.data)
        let session = await this.findSessionByPaymeTransactionId(id);
        // Fallback: try as Medusa session ID
        if (!session) {
            session = await this.findSession(id);
        }
        if (!session) {
            throw new PaymeError(PaymeErrorCodes.TRANSACTION_NOT_FOUND, "Transaction not found");
        }
        const data = typeof session.data === 'string'
            ? JSON.parse(session.data)
            : (session.data || {});
        return {
            create_time: data.payme_create_time || 0,
            perform_time: data.payme_perform_time || 0,
            cancel_time: data.payme_cancel_time || 0,
            transaction: session.id,
            state: data.payme_state || 0,
            reason: data.payme_cancel_reason || null
        };
    }
    /**
     * GetStatement: Get list of transactions for a given period.
     * Used by Payme for reconciliation.
     */
    async getStatement(params) {
        const { from, to } = params;
        this.logger_.info(`[PaymeMerchant] GetStatement: from=${from}, to=${to}`);
        // Validate params
        if (!from || !to) {
            throw new PaymeError(PaymeErrorCodes.INVALID_ACCOUNT, "Missing from/to parameters");
        }
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
            // Query transactions where data->>'payme_create_time' is between from and to
            // We also look for provider_id 'payme'
            // Note: We need to cast the JSON field to bigint/numeric to compare correctly, 
            // but simplistic text comparison might fail if lengths differ. 
            // Better to extract and cast.
            const result = await pgConnection.raw(`
        SELECT 
          id,
          amount,
          currency_code,
          data
        FROM payment_session
        WHERE provider_id LIKE '%payme%'
          AND (data->>'payme_create_time')::bigint >= ?
          AND (data->>'payme_create_time')::bigint <= ?
        ORDER BY (data->>'payme_create_time')::bigint ASC
      `, [from, to]);
            const rows = result?.rows || result || [];
            const transactions = rows.map((row) => {
                const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                return {
                    id: data.payme_transaction_id, // Payme's ID
                    time: Number(data.payme_create_time),
                    amount: Number(row.amount) * 100, // Amount in tiyin/smallest unit
                    account: {
                        order_id: data.cart_id || data.order_id // Provide what we have
                    },
                    create_time: Number(data.payme_create_time),
                    perform_time: Number(data.payme_perform_time || 0),
                    cancel_time: Number(data.payme_cancel_time || 0),
                    transaction: row.id, // Our ID (Medusa Session ID)
                    state: Number(data.payme_state),
                    reason: data.payme_cancel_reason ? Number(data.payme_cancel_reason) : null
                };
            });
            return {
                transactions
            };
        }
        catch (error) {
            this.logger_.error(`[PaymeMerchant] GetStatement error: ${error}`);
            // Return empty list on error or throw? Payme expects clean response or error.
            // If DB fails, internal error.
            throw new PaymeError(PaymeErrorCodes.INTERNAL_ERROR, "Database error during GetStatement");
        }
    }
}
exports.PaymeMerchantService = PaymeMerchantService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bWUtbWVyY2hhbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wYXltZW50LXBheW1lL3NlcnZpY2VzL3BheW1lLW1lcmNoYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFEQUFtRDtBQU9uRCxJQUFZLGVBV1g7QUFYRCxXQUFZLGVBQWU7SUFDekIsOEVBQXVCLENBQUE7SUFDdkIsOEZBQStCLENBQUE7SUFDL0IsZ0dBQWdDLENBQUE7SUFDaEMsa0ZBQXlCLENBQUE7SUFDekIsOEVBQXVCLENBQUE7SUFDdkIsNEZBQThCLENBQUE7SUFDOUIsZ0ZBQXdCLENBQUE7SUFDeEIsa0ZBQXlCLENBQUE7SUFDekIsb0ZBQTBCLENBQUE7SUFDMUIsc0ZBQTJCLENBQUE7QUFDN0IsQ0FBQyxFQVhXLGVBQWUsK0JBQWYsZUFBZSxRQVcxQjtBQUVEOztHQUVHO0FBQ0gsTUFBYSxVQUFXLFNBQVEsS0FBSztJQUNuQyxJQUFJLENBQVE7SUFDWixJQUFJLENBQUs7SUFFVCxZQUFZLElBQVksRUFBRSxPQUFlLEVBQUUsSUFBVTtRQUNuRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtJQUNsQixDQUFDO0NBRUY7QUFWRCxnQ0FVQztBQUNEOzs7R0FHRztBQUNILE1BQWEsb0JBQW9CO0lBQ3JCLE9BQU8sQ0FBUTtJQUNmLFVBQVUsQ0FBSztJQUV6QixZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBd0I7UUFDckQsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUE7SUFDN0IsQ0FBQztJQUVPLEtBQUssQ0FBQyxTQUFTLENBQ3JCLFlBQWlCLEVBQ2pCLFNBQWlCLEVBQ2pCLFVBQWtCO1FBRWxC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