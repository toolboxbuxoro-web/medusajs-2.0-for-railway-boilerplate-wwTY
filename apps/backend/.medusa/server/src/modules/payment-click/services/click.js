"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickPayByCardProviderService = exports.ClickPaymentProviderService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const crypto_1 = __importDefault(require("crypto"));
const click_utils_1 = require("./click-utils");
function formatBaseUrl(url) {
    let u = url;
    if (!u.startsWith("http"))
        u = `https://${u}`;
    return u.replace(/\/$/, "");
}
function buildClickPayUrl(params, payUrl) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && `${v}`.length) {
            qs.set(k, `${v}`);
        }
    }
    return `${payUrl}?${qs.toString()}`;
}
/**
 * Click redirect payment provider (my.click.uz/services/pay).
 */
class ClickPaymentProviderService extends utils_1.AbstractPaymentProvider {
    static identifier = "click";
    logger_;
    options_;
    payUrl_;
    constructor(container, options) {
        super(container, options);
        this.logger_ = container.logger;
        this.options_ = {
            merchant_id: (0, click_utils_1.normalizeString)(options.merchant_id),
            service_id: (0, click_utils_1.normalizeString)(options.service_id),
            secret_key: (0, click_utils_1.normalizeString)(options.secret_key),
            pay_url: options.pay_url,
            merchant_user_id: (0, click_utils_1.normalizeString)(options.merchant_user_id) || undefined,
            card_type: options.card_type,
        };
        this.payUrl_ = formatBaseUrl(options.pay_url || process.env.CLICK_PAY_URL || "https://my.click.uz/services/pay");
    }
    getStoreReturnUrl() {
        const storeUrl = process.env.STORE_URL || "https://toolbox-tools.uz";
        const cleanStoreUrl = storeUrl.replace(/\/$/, "");
        return `${cleanStoreUrl}/api/click-callback`;
    }
    generatePaymentUrl(merchantTransId, amountTiyin) {
        const amount = (0, click_utils_1.formatTiyinToUzsAmount)(amountTiyin);
        const returnUrl = this.getStoreReturnUrl();
        // docs.click.uz/click-button
        return buildClickPayUrl({
            service_id: this.options_.service_id,
            merchant_id: this.options_.merchant_id,
            amount,
            transaction_param: merchantTransId,
            return_url: returnUrl,
            card_type: this.options_.card_type,
        }, this.payUrl_);
    }
    async initiatePayment(input) {
        try {
            const { context, amount, currency_code } = input;
            const merchantTransId = context?.resource_id || crypto_1.default.randomUUID().replace(/-/g, "");
            const paymentUrl = this.generatePaymentUrl(merchantTransId, Number(amount));
            const sessionData = {
                merchant_trans_id: merchantTransId,
                amount_tiyin: Number(amount),
                amount: (0, click_utils_1.formatTiyinToUzsAmount)(Number(amount)),
                currency: currency_code || "uzs",
                payment_url: paymentUrl,
                click_state: "pending",
                mode: "redirect",
                public_config: {
                    merchant_id: this.options_.merchant_id,
                    service_id: this.options_.service_id,
                    merchant_user_id: this.options_.merchant_user_id,
                    card_type: this.options_.card_type,
                },
            };
            return { data: sessionData };
        }
        catch (error) {
            this.logger_.error(`[Click] Error initiating payment: ${error.message}`);
            return {
                error: error.message,
                code: "CLICK_INITIATE_ERROR",
                detail: error,
            };
        }
    }
    async authorizePayment(input) {
        const sessionData = (input.data || input);
        // Mark authorized when our Click callback (Complete) succeeded
        const isAuthorized = sessionData.click_state === "completed" ||
            (sessionData.click_error === 0 && sessionData.merchant_prepare_id);
        const isCancelled = sessionData.click_state === "cancelled" ||
            (typeof sessionData.click_error === "number" && sessionData.click_error < 0);
        const status = isAuthorized
            ? utils_1.PaymentSessionStatus.AUTHORIZED
            : isCancelled
                ? utils_1.PaymentSessionStatus.CANCELED
                : utils_1.PaymentSessionStatus.PENDING;
        return {
            status,
            data: {
                ...sessionData,
            },
        };
    }
    async cancelPayment(input) {
        const sessionData = (input.data || input);
        return {
            data: {
                ...sessionData,
                click_state: "cancelled",
            },
        };
    }
    async capturePayment(input) {
        const sessionData = (input.data || input);
        return { data: { ...sessionData } };
    }
    async deletePayment(input) {
        const sessionData = (input.data || input);
        return { data: { ...sessionData, click_state: "cancelled" } };
    }
    async getPaymentStatus(input) {
        const sessionData = (input.data || input);
        if (sessionData.click_state === "completed") {
            return utils_1.PaymentSessionStatus.AUTHORIZED;
        }
        if (sessionData.click_state === "cancelled") {
            return utils_1.PaymentSessionStatus.CANCELED;
        }
        if (typeof sessionData.click_error === "number" && sessionData.click_error < 0) {
            return utils_1.PaymentSessionStatus.CANCELED;
        }
        return utils_1.PaymentSessionStatus.PENDING;
    }
    async refundPayment(input) {
        const sessionData = (input.data || input);
        return {
            data: {
                ...sessionData,
                click_state: "cancelled",
            },
        };
    }
    async retrievePayment(input) {
        const sessionData = (input.data || input);
        return { data: sessionData };
    }
    async updatePayment(input) {
        const { data, amount } = input;
        const sessionData = data;
        if (amount && Number(amount) !== Number(sessionData.amount_tiyin)) {
            const paymentUrl = this.generatePaymentUrl(sessionData.merchant_trans_id, Number(amount));
            return {
                data: {
                    ...sessionData,
                    amount_tiyin: Number(amount),
                    amount: (0, click_utils_1.formatTiyinToUzsAmount)(Number(amount)),
                    payment_url: paymentUrl,
                },
            };
        }
        return { data: { ...sessionData } };
    }
    async getWebhookActionAndData(_data) {
        // Click uses server-to-server callbacks (Prepare/Complete) rather than webhooks here
        return { action: "not_supported" };
    }
}
exports.ClickPaymentProviderService = ClickPaymentProviderService;
/**
 * Click Pay-by-card provider (checkout.js widget).
 * We still rely on the same Click Prepare/Complete callbacks on the backend.
 */
class ClickPayByCardProviderService extends ClickPaymentProviderService {
    static identifier = "click_pay_by_card";
    async initiatePayment(input) {
        const base = await super.initiatePayment(input);
        if (base?.data) {
            base.data.mode = "pay_by_card";
            // In pay-by-card flow we don't need payment_url, but we keep it as a fallback.
        }
        return base;
    }
}
exports.ClickPayByCardProviderService = ClickPayByCardProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wYXltZW50LWNsaWNrL3NlcnZpY2VzL2NsaWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUdrQztBQU1sQyxvREFBMkI7QUFDM0IsK0NBQXVFO0FBc0N2RSxTQUFTLGFBQWEsQ0FBQyxHQUFXO0lBQ2hDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQTtJQUNYLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFBO0lBQzdDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDN0IsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsTUFBMEMsRUFBRSxNQUFjO0lBQ2xGLE1BQU0sRUFBRSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUE7SUFDaEMsS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25ELEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNuQixDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUE7QUFDckMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBYSwyQkFBNEIsU0FBUSwrQkFBZ0M7SUFDL0UsTUFBTSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUE7SUFFakIsT0FBTyxDQUFRO0lBQ2YsUUFBUSxDQUFT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