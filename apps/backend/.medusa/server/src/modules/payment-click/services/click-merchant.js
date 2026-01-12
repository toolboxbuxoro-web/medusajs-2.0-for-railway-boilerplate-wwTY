"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickMerchantService = exports.ClickErrorCodes = void 0;
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
const click_utils_1 = require("./click-utils");
var ClickErrorCodes;
(function (ClickErrorCodes) {
    ClickErrorCodes[ClickErrorCodes["SUCCESS"] = 0] = "SUCCESS";
    ClickErrorCodes[ClickErrorCodes["SIGN_CHECK_FAILED"] = -1] = "SIGN_CHECK_FAILED";
    ClickErrorCodes[ClickErrorCodes["INCORRECT_AMOUNT"] = -2] = "INCORRECT_AMOUNT";
    ClickErrorCodes[ClickErrorCodes["ACTION_NOT_FOUND"] = -3] = "ACTION_NOT_FOUND";
    ClickErrorCodes[ClickErrorCodes["ALREADY_PAID"] = -4] = "ALREADY_PAID";
    ClickErrorCodes[ClickErrorCodes["USER_DOES_NOT_EXIST"] = -5] = "USER_DOES_NOT_EXIST";
    ClickErrorCodes[ClickErrorCodes["TRANSACTION_DOES_NOT_EXIST"] = -6] = "TRANSACTION_DOES_NOT_EXIST";
    ClickErrorCodes[ClickErrorCodes["FAILED_TO_UPDATE_USER"] = -7] = "FAILED_TO_UPDATE_USER";
    ClickErrorCodes[ClickErrorCodes["ERROR_IN_REQUEST_FROM_CLICK"] = -8] = "ERROR_IN_REQUEST_FROM_CLICK";
    ClickErrorCodes[ClickErrorCodes["TRANSACTION_CANCELLED"] = -9] = "TRANSACTION_CANCELLED";
})(ClickErrorCodes || (exports.ClickErrorCodes = ClickErrorCodes = {}));
class ClickMerchantService {
    logger_;
    container_;
    constructor({ logger, container }) {
        this.logger_ = logger;
        this.container_ = container;
    }
    getSecretKey() {
        return (0, click_utils_1.normalizeString)(process.env.CLICK_SECRET_KEY);
    }
    getServiceId() {
        return (0, click_utils_1.normalizeString)(process.env.CLICK_SERVICE_ID);
    }
    getUserId() {
        return (0, click_utils_1.normalizeString)(process.env.CLICK_USER_ID);
    }
    /**
     * Generate Auth header for Click Fiscalization API
     * Format: {user_id}:{sha1(timestamp + secret_key)}:{timestamp}
     */
    generateAuthHeader() {
        const userId = this.getUserId();
        const secretKey = this.getSecretKey();
        const timestamp = Math.floor(Date.now() / 1000);
        const crypto = require("crypto");
        const digest = crypto
            .createHash("sha1")
            .update(`${timestamp}${secretKey}`)
            .digest("hex");
        return `${userId}:${digest}:${timestamp}`;
    }
    /**
     * Fetch cart items for fiscalization
     * Returns items with MXIK codes, prices, quantities for Click OFD API
     */
    async getCartItemsForFiscalization(cartId, expectedTotalTiyin) {
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
            // Check if columns exist
            const hasDeletedAt = await this.hasColumn(pgConnection, "cart_line_item", "deleted_at");
            const hasTotal = await this.hasColumn(pgConnection, "cart_line_item", "total");
            const whereDeleted = hasDeletedAt ? "AND cli.deleted_at IS NULL" : "";
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
            const items = [];
            const itemsWithoutMxik = [];
            for (const row of rows) {
                const title = row.product_title
                    ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
                    : (row.title || "Товар");
                const productMetadata = typeof row.product_metadata === 'string'
                    ? JSON.parse(row.product_metadata)
                    : (row.product_metadata || {});
                const mxikCode = productMetadata.mxik_code;
                if (!mxikCode) {
                    itemsWithoutMxik.push(title);
                }
                const qty = Math.max(1, Number(row.quantity) || 1);
                const lineTotalSums = hasTotal
                    ? Number(row.line_total)
                    : Number(row.unit_price) * qty;
                const lineTotalTiyins = Math.round(lineTotalSums * 100);
                const unit = Math.floor(lineTotalTiyins / qty);
                const remainder = lineTotalTiyins - unit * qty;
                items.push({
                    name: title.substring(0, 128),
                    price: unit + remainder,
                    count: qty,
                    code: mxikCode || "MISSING",
                    vat_percent: 12,
                    package_code: productMetadata.package_code || "2009"
                });
            }
            // Add shipping if present
            const shippingResult = await pgConnection.raw(`
        SELECT 
          csm.amount as shipping_amount,
          so.name as shipping_name
        FROM cart_shipping_method csm
        LEFT JOIN shipping_option so ON so.id = csm.shipping_option_id
        WHERE csm.cart_id = ?
      `, [cartId]);
            const shippingRows = shippingResult?.rows || shippingResult || [];
            const SHIPPING_MXIK_CODE = "10105001001000000";
            for (const shipping of shippingRows) {
                const shippingAmount = Number(shipping.shipping_amount);
                if (shippingAmount > 0) {
                    items.push({
                        name: (shipping.shipping_name || "Доставка").substring(0, 128),
                        price: Math.round(shippingAmount * 100),
                        count: 1,
                        code: SHIPPING_MXIK_CODE,
                        vat_percent: 12,
                        package_code: "2009"
                    });
                }
            }
            if (itemsWithoutMxik.length > 0) {
                this.logger_.warn(`[ClickMerchant] Items without MXIK code: ${itemsWithoutMxik.join(', ')}`);
            }
            const itemsSum = items.reduce((sum, item) => sum + (item.price * item.count), 0);
            this.logger_.info(`[ClickMerchant] Prepared ${items.length} items for fiscalization, sum=${itemsSum} tiyin`);
            return items;
        }
        catch (error) {
            this.logger_.error(`[ClickMerchant] Error fetching cart items: ${error}`);
            return [];
        }
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
     * Submit fiscalization data to Click OFD API
     * Called after successful payment completion
     */
    async submitFiscalizationData(params) {
        const { paymentId, cartId, amountTiyin } = params;
        if (!this.getUserId()) {
            this.logger_.warn("[ClickMerchant] CLICK_USER_ID not set - skipping fiscalization");
            return false;
        }
        try {
            const items = await this.getCartItemsForFiscalization(cartId, amountTiyin);
            if (items.length === 0) {
                this.logger_.warn("[ClickMerchant] No items for fiscalization");
                return false;
            }
            const payload = {
                service_id: parseInt(this.getServiceId(), 10),
                payment_id: parseInt(paymentId, 10),
                items: items,
                received_card: amountTiyin, // Payment by card
                received_cash: 0,
                received_ecash: 0
            };
            const authHeader = this.generateAuthHeader();
            this.logger_.info(`[ClickMerchant] Submitting fiscalization for payment_id=${paymentId}`);
            const response = await fetch("https://api.click.uz/v2/merchant/payment/ofd_data/submit_items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Auth": authHeader
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (response.ok && result.error_code === 0) {
                this.logger_.info(`[ClickMerchant] Fiscalization submitted successfully for payment_id=${paymentId}`);
                return true;
            }
            else {
                this.logger_.error(`[ClickMerchant] Fiscalization failed: ${JSON.stringify(result)}`);
                return false;
            }
        }
        catch (error) {
            this.logger_.error(`[ClickMerchant] Error submitting fiscalization: ${error}`);
            return false;
        }
    }
    /**
     * Find Click payment session by merchant_trans_id (we use cart_id).
     * Uses raw SQL to query by JSON field since remoteQuery filters can be unreliable.
     */
    async getPaymentSessionByMerchantTransId(merchantTransId) {
        try {
            const pgConnection = this.container_.resolve("__pg_connection__");
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
        WHERE ps.data->>'merchant_trans_id' = ?
          AND ps.provider_id LIKE '%click%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [merchantTransId]);
            const rows = result?.rows || result || [];
            return rows[0] || null;
        }
        catch (e) {
            this.logger_.error(`[ClickMerchant] DB error: ${e}`);
            return null;
        }
    }
    parseSessionData(raw) {
        if (!raw)
            return {};
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            }
            catch {
                return {};
            }
        }
        return raw;
    }
    buildPrepareResponse(input) {
        return {
            click_trans_id: input.click_trans_id,
            merchant_trans_id: input.merchant_trans_id,
            merchant_prepare_id: input.merchant_prepare_id,
            error: input.error,
            error_note: input.error_note,
        };
    }
    buildCompleteResponse(input) {
        // docs.click.uz/click-api-error mentions merchant_confirm_id for Complete response
        return {
            click_trans_id: input.click_trans_id,
            merchant_trans_id: input.merchant_trans_id,
            merchant_confirm_id: input.merchant_confirm_id,
            error: input.error,
            error_note: input.error_note,
        };
    }
    validateAmountMatchesSession(clickAmountStr, sessionAmountTiyin) {
        const parsed = (0, click_utils_1.parseUzsAmountToTiyin)(clickAmountStr);
        if (parsed === null)
            return false;
        const expected = BigInt(Math.round(Number(sessionAmountTiyin || 0)));
        return expected === parsed;
    }
    async handlePrepare(body) {
        const click_trans_id = (0, click_utils_1.normalizeString)(body.click_trans_id);
        const service_id = (0, click_utils_1.normalizeString)(body.service_id);
        const click_paydoc_id = (0, click_utils_1.normalizeString)(body.click_paydoc_id);
        const merchant_trans_id = (0, click_utils_1.normalizeString)(body.merchant_trans_id);
        const amount = (0, click_utils_1.normalizeString)(body.amount);
        const action = (0, click_utils_1.normalizeString)(body.action);
        const sign_time = (0, click_utils_1.normalizeString)(body.sign_time);
        const sign_string = (0, click_utils_1.normalizeString)(body.sign_string);
        this.logger_.info(`[ClickMerchant] Prepare: merchant_trans_id=${merchant_trans_id} click_trans_id=${click_trans_id} amount=${amount} action=${action}`);
        // Basic required fields
        if (!click_trans_id ||
            !service_id ||
            !merchant_trans_id ||
            !amount ||
            !action ||
            !sign_time ||
            !sign_string) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
                error_note: "Error in request from click",
            });
        }
        if (action !== "0") {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.ACTION_NOT_FOUND,
                error_note: "Action not found",
            });
        }
        // Validate service_id (optional hard check)
        const configuredServiceId = this.getServiceId();
        if (configuredServiceId && configuredServiceId !== service_id) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
                error_note: "Invalid service_id",
            });
        }
        // Signature check
        const ok = (0, click_utils_1.verifyClickPrepareSignature)({
            click_trans_id,
            service_id,
            secret_key: this.getSecretKey(),
            merchant_trans_id,
            amount,
            action,
            sign_time,
            sign_string,
        });
        if (!ok) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.SIGN_CHECK_FAILED,
                error_note: "SIGN CHECK FAILED!",
            });
        }
        const session = await this.getPaymentSessionByMerchantTransId(merchant_trans_id);
        if (!session) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.USER_DOES_NOT_EXIST,
                error_note: "User does not exist",
            });
        }
        if (session.completed_at) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.ALREADY_PAID,
                error_note: "Already paid",
            });
        }
        if (!this.validateAmountMatchesSession(amount, session.amount)) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: "0",
                error: ClickErrorCodes.INCORRECT_AMOUNT,
                error_note: "Incorrect parameter amount",
            });
        }
        const currentData = this.parseSessionData(session.data);
        // Idempotency: if already prepared for this click_trans_id return previous prepare id
        if (currentData.click_trans_id === click_trans_id && currentData.merchant_prepare_id) {
            return this.buildPrepareResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_prepare_id: String(currentData.merchant_prepare_id),
                error: ClickErrorCodes.SUCCESS,
                error_note: "Success",
            });
        }
        // Use click_trans_id as merchant_prepare_id (numeric string, stable, unique)
        const merchant_prepare_id = click_trans_id;
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        await paymentModule.updatePaymentSession({
            id: session.id,
            amount: Number(session.amount),
            currency_code: session.currency_code || "uzs",
            data: {
                ...currentData,
                click_state: "prepared",
                click_trans_id,
                click_paydoc_id,
                merchant_prepare_id,
                click_error: 0,
                click_error_note: "Success",
                sign_time,
                // Store cart_id explicitly in session data, same pattern as Payme
                cart_id: session.cart_id,
            },
        });
        return this.buildPrepareResponse({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id,
            error: ClickErrorCodes.SUCCESS,
            error_note: "Success",
        });
    }
    async handleComplete(body) {
        const click_trans_id = (0, click_utils_1.normalizeString)(body.click_trans_id);
        const service_id = (0, click_utils_1.normalizeString)(body.service_id);
        const click_paydoc_id = (0, click_utils_1.normalizeString)(body.click_paydoc_id);
        const merchant_trans_id = (0, click_utils_1.normalizeString)(body.merchant_trans_id);
        const merchant_prepare_id = (0, click_utils_1.normalizeString)(body.merchant_prepare_id);
        const amount = (0, click_utils_1.normalizeString)(body.amount);
        const action = (0, click_utils_1.normalizeString)(body.action);
        const errorStr = (0, click_utils_1.normalizeString)(body.error);
        const error_note_in = (0, click_utils_1.normalizeString)(body.error_note);
        const sign_time = (0, click_utils_1.normalizeString)(body.sign_time);
        const sign_string = (0, click_utils_1.normalizeString)(body.sign_string);
        const clickError = errorStr ? Number(errorStr) : 0;
        this.logger_.info(`[ClickMerchant] Complete: merchant_trans_id=${merchant_trans_id} click_trans_id=${click_trans_id} prepare_id=${merchant_prepare_id} amount=${amount} action=${action} error=${clickError}`);
        // Basic required fields
        if (!click_trans_id ||
            !service_id ||
            !merchant_trans_id ||
            !merchant_prepare_id ||
            !amount ||
            !action ||
            !sign_time ||
            !sign_string) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
                error_note: "Error in request from click",
            });
        }
        if (action !== "1") {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.ACTION_NOT_FOUND,
                error_note: "Action not found",
            });
        }
        // Validate service_id (optional hard check)
        const configuredServiceId = this.getServiceId();
        if (configuredServiceId && configuredServiceId !== service_id) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.ERROR_IN_REQUEST_FROM_CLICK,
                error_note: "Invalid service_id",
            });
        }
        // Signature check
        const ok = (0, click_utils_1.verifyClickCompleteSignature)({
            click_trans_id,
            service_id,
            secret_key: this.getSecretKey(),
            merchant_trans_id,
            merchant_prepare_id,
            amount,
            action,
            sign_time,
            sign_string,
        });
        if (!ok) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.SIGN_CHECK_FAILED,
                error_note: "SIGN CHECK FAILED!",
            });
        }
        const session = await this.getPaymentSessionByMerchantTransId(merchant_trans_id);
        if (!session) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.USER_DOES_NOT_EXIST,
                error_note: "User does not exist",
            });
        }
        if (!this.validateAmountMatchesSession(amount, session.amount)) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.INCORRECT_AMOUNT,
                error_note: "Incorrect parameter amount",
            });
        }
        const currentData = this.parseSessionData(session.data);
        // Validate merchant_prepare_id against what we stored at Prepare
        if (currentData.merchant_prepare_id && String(currentData.merchant_prepare_id) !== merchant_prepare_id) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: "0",
                error: ClickErrorCodes.TRANSACTION_DOES_NOT_EXIST,
                error_note: "Transaction does not exist",
            });
        }
        // Idempotency: if already completed and no error, return success
        if (currentData.click_state === "completed" && currentData.click_error === 0) {
            return this.buildCompleteResponse({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: merchant_prepare_id,
                error: ClickErrorCodes.SUCCESS,
                error_note: "Success",
            });
        }
        const paymentModule = this.container_.resolve(utils_1.Modules.PAYMENT);
        // Update session data first
        const nextState = clickError === 0 ? "completed" : clickError === ClickErrorCodes.TRANSACTION_CANCELLED ? "cancelled" : "error";
        await paymentModule.updatePaymentSession({
            id: session.id,
            amount: Number(session.amount),
            currency_code: session.currency_code || "uzs",
            data: {
                ...currentData,
                click_state: nextState,
                click_trans_id,
                click_paydoc_id,
                merchant_prepare_id,
                click_error: clickError,
                click_error_note: error_note_in || (clickError === 0 ? "Success" : "Error"),
                sign_time,
                transaction_id: click_paydoc_id || click_trans_id,
            },
        });
        // On success, complete cart to create order
        if (clickError === 0) {
            const cartId = currentData.cart_id;
            if (!cartId) {
                // Follow the same backend-only cart_id pattern as Payme:
                // cart_id must be present in session.data (set during Prepare) and
                // we never attempt to guess or derive it here.
                this.logger_.error(`[ClickMerchant] Missing cart_id for merchant_trans_id=${merchant_trans_id}. Cannot complete cart.`);
            }
            else if (!session.completed_at) {
                try {
                    await (0, core_flows_1.completeCartWorkflow)(this.container_).run({
                        input: { id: cartId },
                    });
                    this.logger_.info(`[ClickMerchant] Completed cart ${cartId} for click_trans_id=${click_trans_id}`);
                    // Submit fiscalization data after successful payment
                    const paymentId = click_paydoc_id || click_trans_id;
                    const amountTiyin = (0, click_utils_1.parseUzsAmountToTiyin)(amount);
                    if (paymentId && amountTiyin) {
                        await this.submitFiscalizationData({
                            paymentId,
                            cartId,
                            amountTiyin: Number(amountTiyin)
                        });
                    }
                }
                catch (e) {
                    this.logger_.error(`[ClickMerchant] Failed to complete cart ${cartId}: ${e}`);
                    // Still return success to Click to avoid desync
                }
            }
        }
        return this.buildCompleteResponse({
            click_trans_id,
            merchant_trans_id,
            merchant_confirm_id: merchant_prepare_id,
            error: clickError,
            error_note: error_note_in || (clickError === 0 ? "Success" : "Error"),
        });
    }
}
exports.ClickMerchantService = ClickMerchantService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpY2stbWVyY2hhbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wYXltZW50LWNsaWNrL3NlcnZpY2VzL2NsaWNrLW1lcmNoYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFEQUFtRDtBQUNuRCw0REFBa0U7QUFDbEUsK0NBS3NCO0FBRXRCLElBQVksZUFXWDtBQVhELFdBQVksZUFBZTtJQUN6QiwyREFBVyxDQUFBO0lBQ1gsZ0ZBQXNCLENBQUE7SUFDdEIsOEVBQXFCLENBQUE7SUFDckIsOEVBQXFCLENBQUE7SUFDckIsc0VBQWlCLENBQUE7SUFDakIsb0ZBQXdCLENBQUE7SUFDeEIsa0dBQStCLENBQUE7SUFDL0Isd0ZBQTBCLENBQUE7SUFDMUIsb0dBQWdDLENBQUE7SUFDaEMsd0ZBQTBCLENBQUE7QUFDNUIsQ0FBQyxFQVhXLGVBQWUsK0JBQWYsZUFBZSxRQVcxQjtBQXdCRCxNQUFhLG9CQUFvQjtJQUNyQixPQUFPLENBQVE7SUFDZixVQUFVLENBQUs7SUFFekIsWUFBWSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQXdCO1FBQ3JELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFBO0lBQzdCLENBQUM7SUFFTyxZQUFZO1FBQ2xCLE9BQU8sSUFBQSw2QkFBZSxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtJQUN0RCxDQUFDO0lBRU8sWUFBWTtRQUNsQixPQUFPLElBQUEsNkJBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUE7SUFDdEQsQ0FBQztJQUVPLFNBQVM7UUFDZixPQUFPLElBQUEsNkJBQWUsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBQ25ELENBQUM7SUFFRDs7O09BR0c7SUFDSyxrQkFBa0I7UUFD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