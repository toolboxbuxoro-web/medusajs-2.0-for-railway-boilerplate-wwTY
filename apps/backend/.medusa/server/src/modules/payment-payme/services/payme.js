"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymePaymentProviderService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Payme Payment Provider Service for Medusa 2.0.
 * Handles payment URL generation and session lifecycle.
 */
class PaymePaymentProviderService extends utils_1.AbstractPaymentProvider {
    static identifier = "payme";
    logger_;
    options_;
    paymeUrl_;
    constructor(container, options) {
        super(container, options);
        this.logger_ = container.logger;
        // Trim credentials to avoid whitespace issues
        this.options_ = {
            payme_id: options.payme_id?.trim(),
            payme_key: options.payme_key?.trim(),
            payme_url: options.payme_url
        };
        // Priority: options.payme_url -> env PAYME_URL -> default
        this.paymeUrl_ = this.formatPaymeUrl(options.payme_url || process.env.PAYME_URL || "https://checkout.paycom.uz");
    }
    formatPaymeUrl(url) {
        let formatted = url;
        if (!formatted.startsWith("http")) {
            formatted = `https://${formatted}`;
        }
        return formatted.replace(/\/$/, "");
    }
    /**
     * Generate Payme payment URL.
     * @param orderId - Cart ID used as order identifier.
     * @param amount - Amount in tiyin (Medusa 2.0 stores amounts in minor units).
     * @param currencyCode - Currency code (default UZS).
     */
    generatePaymentUrl(orderId, amount, currencyCode = "UZS") {
        // Medusa 2.0 stores amounts in standard units (Soms), but Payme expects tiyins (1/100 Som)
        const amountForPayme = Math.round(amount * 100);
        // Get Store URL for redirect after payment
        // Use STORE_URL (storefront) for redirect, not MEDUSA_BACKEND_URL
        const storeUrl = process.env.STORE_URL || "https://toolbox-tools.uz";
        const cleanStoreUrl = storeUrl.replace(/\/$/, "");
        // Use API callback route that handles locale redirect
        // Include order_id so callback can identify which order was paid
        const returnUrl = `${cleanStoreUrl}/api/payme-callback?order_id=${encodeURIComponent(orderId)}`;
        if (!this.options_.payme_id) {
            this.logger_.error(`[Payme] Missing payme_id in options!`);
            throw new Error("Payme configuration error: Missing PAYME_ID");
        }
        // Payme format: m=merchant_id;ac.order_id=order_id;a=amount;c=return_url
        const paramString = `m=${this.options_.payme_id};ac.order_id=${orderId};a=${amountForPayme};c=${returnUrl}`;
        // Debug log to verify parameters before encoding
        this.logger_.info(`[Payme] Generating URL with params: ${paramString}`);
        const encodedParams = Buffer.from(paramString).toString("base64");
        const paymentUrl = `${this.paymeUrl_}/${encodedParams}`;
        this.logger_.info(`[Payme] Generated Payment URL: ${paymentUrl}`);
        return paymentUrl;
    }
    // ─────────────────────────────────────────────────────────────────────────────
    // Payment Provider Interface Methods
    // ─────────────────────────────────────────────────────────────────────────────
    async initiatePayment(input) {
        try {
            const { context, amount, currency_code } = input;
            const orderId = context?.resource_id || crypto_1.default.randomUUID();
            const paymentUrl = this.generatePaymentUrl(orderId, amount, currency_code);
            const sessionData = {
                order_id: orderId,
                amount: amount,
                currency: currency_code,
                payment_url: paymentUrl,
                status: "pending"
            };
            return { data: sessionData };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error initiating payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_INITIATE_ERROR",
                detail: error
            };
        }
    }
    async authorizePayment(input) {
        try {
            const sessionData = (input.data || input);
            // Check if payment was completed by Payme (state=2 means performed)
            const isAuthorized = sessionData.payme_state === 2 || sessionData.transaction_id;
            const status = isAuthorized
                ? utils_1.PaymentSessionStatus.AUTHORIZED
                : utils_1.PaymentSessionStatus.PENDING;
            return {
                status,
                data: {
                    ...sessionData,
                    status: isAuthorized ? "authorized" : "pending"
                }
            };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error authorizing payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_AUTHORIZE_ERROR",
                detail: error
            };
        }
    }
    async cancelPayment(input) {
        try {
            const sessionData = (input.data || input);
            this.logger_.info(`[Payme] Cancelling payment: order_id=${sessionData.order_id}`);
            return {
                data: {
                    ...sessionData,
                    status: "canceled"
                }
            };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error canceling payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_CANCEL_ERROR",
                detail: error
            };
        }
    }
    async capturePayment(input) {
        try {
            const sessionData = (input.data || input);
            this.logger_.info(`[Payme] Capturing payment: order_id=${sessionData.order_id}`);
            return {
                data: {
                    ...sessionData,
                    status: "captured"
                }
            };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error capturing payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_CAPTURE_ERROR",
                detail: error
            };
        }
    }
    async deletePayment(input) {
        const sessionData = (input.data || input);
        return {
            data: {
                ...sessionData,
                status: "canceled"
            }
        };
    }
    async getPaymentStatus(input) {
        const sessionData = (input.data || input);
        // Check Payme's state for definitive status
        if (sessionData.payme_state === 2 || sessionData.status === "captured") {
            return utils_1.PaymentSessionStatus.AUTHORIZED;
        }
        if (sessionData.payme_state && sessionData.payme_state < 0) {
            return utils_1.PaymentSessionStatus.CANCELED;
        }
        if (sessionData.status === "canceled") {
            return utils_1.PaymentSessionStatus.CANCELED;
        }
        return utils_1.PaymentSessionStatus.PENDING;
    }
    async refundPayment(input) {
        try {
            const sessionData = (input.data || input);
            const refundAmount = input.amount || 0;
            this.logger_.info(`[Payme] Refunding payment: order_id=${sessionData.order_id}, amount=${refundAmount}`);
            return {
                data: {
                    ...sessionData,
                    status: "refunded",
                    refund_amount: refundAmount
                }
            };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error refunding payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_REFUND_ERROR",
                detail: error
            };
        }
    }
    async retrievePayment(input) {
        const sessionData = (input.data || input);
        return { data: sessionData };
    }
    async updatePayment(input) {
        try {
            const { data, context, amount, currency_code } = input;
            const sessionData = data;
            this.logger_.info(`[Payme] Updating payment: order_id=${sessionData.order_id}`);
            // If amount changed, regenerate payment URL
            if (amount && amount !== sessionData.amount) {
                const currency = currency_code || sessionData.currency || "UZS";
                const paymentUrl = this.generatePaymentUrl(sessionData.order_id, amount, currency);
                return {
                    data: {
                        ...sessionData,
                        amount,
                        currency: currency_code || sessionData.currency,
                        payment_url: paymentUrl
                    }
                };
            }
            return {
                data: {
                    ...sessionData,
                    ...context
                }
            };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error updating payment: ${error.message}`);
            return {
                error: error.message,
                code: "PAYME_UPDATE_ERROR",
                detail: error
            };
        }
    }
    async getWebhookActionAndData(data) {
        try {
            const payload = data.data;
            if (payload?.status === "success" || payload?.transaction_id) {
                return {
                    action: "authorized",
                    data: {
                        session_id: payload.order_id,
                        amount: payload.amount ? Number(payload.amount) : 0
                    }
                };
            }
            if (payload?.status === "canceled") {
                return {
                    action: "failed",
                    data: {
                        session_id: payload.order_id,
                        amount: payload.amount ? Number(payload.amount) : 0
                    }
                };
            }
            return { action: "not_supported" };
        }
        catch (error) {
            this.logger_.error(`[Payme] Error processing webhook: ${error.message}`);
            return { action: "not_supported" };
        }
    }
}
exports.PaymePaymentProviderService = PaymePaymentProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wYXltZW50LXBheW1lL3NlcnZpY2VzL3BheW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUdrQztBQU1sQyxvREFBMkI7QUF5QjNCOzs7R0FHRztBQUNILE1BQWEsMkJBQTRCLFNBQVEsK0JBQWdDO0lBQy9FLE1BQU0sQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFBO0lBQ2pCLE9BQU8sQ0FBUTtJQUNmLFFBQVEsQ0FBUztJQUNqQixTQUFTLENBQVE7SUFFM0IsWUFBWSxTQUErQixFQUFFLE9BQWdCO1FBQzNELEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1FBRS9CLDhDQUE4QztRQUM5QyxJQUFJLENBQUMsUUFBUSxHQUFHO1lBQ2QsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFO1lBQ2xDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRTtZQUNwQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7U0FDN0IsQ0FBQTtRQUVELDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQ2xDLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksNEJBQTRCLENBQzNFLENBQUE7SUFFSCxDQUFDO0lBRU8sY0FBYyxDQUFDLEdBQVc7UUFDaEMsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFBO1FBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDbEMsU0FBUyxHQUFHLFdBQVcsU0FBUyxFQUFFLENBQUE7UUFDcEMsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFD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