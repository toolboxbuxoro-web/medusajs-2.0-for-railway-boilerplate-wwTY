"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EskizNotificationService = void 0;
const utils_1 = require("@medusajs/framework/utils");
/**
 * Service to handle SMS notifications using the Eskiz.uz API.
 */
class EskizNotificationService extends utils_1.AbstractNotificationProviderService {
    static identifier = "ESKIZ_NOTIFICATION_SERVICE";
    config_;
    logger_;
    cachedToken = null;
    baseUrl = "https://notify.eskiz.uz";
    constructor({ logger }, options) {
        super();
        this.config_ = {
            email: options.email,
            password: options.password,
            from: options.from
        };
        this.logger_ = logger;
    }
    tokenIsFresh() {
        if (!this.cachedToken)
            return false;
        // Eskiz tokens are typically long-lived; we refresh conservatively every 12h
        return Date.now() - this.cachedToken.fetchedAt < 12 * 60 * 60 * 1000;
    }
    async getToken() {
        if (this.tokenIsFresh())
            return this.cachedToken.token;
        if (!this.config_.email || !this.config_.password) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing ESKIZ_EMAIL or ESKIZ_PASSWORD");
        }
        const form = new FormData();
        form.set("email", this.config_.email);
        form.set("password", this.config_.password);
        const resp = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: form,
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            this.logger_.error(`[Eskiz] auth/login failed: ${resp.status} ${text}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Eskiz login failed (${resp.status})`);
        }
        const json = (await resp.json());
        const token = json?.data?.token;
        if (!token) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, "Eskiz login succeeded but token missing in response");
        }
        this.cachedToken = { token, fetchedAt: Date.now() };
        return token;
    }
    async send(notification) {
        if (!notification) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `No notification information provided`);
        }
        // We only support SMS channel
        if (notification.channel !== 'sms') {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Channel ${notification.channel} not supported by Eskiz`);
        }
        const token = await this.getToken();
        const toPhone = notification.to;
        // If we have a generic message in data, use it, otherwise use what's provided
        const message = notification.data?.message || notification.data?.text || "";
        if (!toPhone || !message) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing phone number or message content");
        }
        // LOCAL MOCK: Skip actual API call in local environment
        if (process.env.APP_ENV === 'local' || process.env.NODE_ENV === 'development' || process.env.SKIP_EXTERNAL_SERVICES) {
            // Extract OTP code if possible for better logging format: [MOCK_SMS][OTP] +998XXXXXXXXX → 123456
            const otpMatch = message.match(/\d{6}/);
            const otpCode = otpMatch ? otpMatch[0] : "UNKNOWN";
            this.logger_.info(`[MOCK_SMS][OTP] ${toPhone} → ${otpCode}`);
            return {};
        }
        const form = new FormData();
        form.set("mobile_phone", toPhone.replace(/\+/g, "")); // Eskiz expects phone without +
        form.set("message", message);
        form.set("from", this.config_.from);
        const sendRequest = async (authToken) => {
            return fetch(`${this.baseUrl}/api/message/sms/send`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: form,
            });
        };
        let resp = await sendRequest(token);
        // If token expired, retry once
        if (resp.status === 401 || resp.status === 403) {
            this.cachedToken = null;
            const newToken = await this.getToken();
            resp = await sendRequest(newToken);
        }
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            this.logger_.error(`[Eskiz] sms/send failed: ${resp.status} ${text}`);
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.UNEXPECTED_STATE, `Eskiz sms send failed (${resp.status})`);
        }
        this.logger_.info(`Successfully sent SMS to ${toPhone} via Eskiz`);
        return {};
    }
}
exports.EskizNotificationService = EskizNotificationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2Vza2l6LXNtcy9zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHFEQUE0RjtBQXlCNUY7O0dBRUc7QUFDSCxNQUFhLHdCQUF5QixTQUFRLDJDQUFtQztJQUMvRSxNQUFNLENBQUMsVUFBVSxHQUFHLDRCQUE0QixDQUFBO0lBQ3RDLE9BQU8sQ0FBb0I7SUFDM0IsT0FBTyxDQUFRO0lBQ2YsV0FBVyxHQUFnRCxJQUFJLENBQUE7SUFDL0QsT0FBTyxHQUFXLHlCQUF5QixDQUFBO0lBRXJELFlBQVksRUFBRSxNQUFNLEVBQXdCLEVBQUUsT0FBd0M7UUFDcEYsS0FBSyxFQUFFLENBQUE7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHO1lBQ2IsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1lBQ3BCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtZQUMxQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7U0FDbkIsQ0FBQTtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO0lBQ3ZCLENBQUM7SUFFTyxZQUFZO1FBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVztZQUFFLE9BQU8sS0FBSyxDQUFBO1FBQ25DLDZFQUE2RTtRQUM3RSxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUE7SUFDdEUsQ0FBQztJQUVPLEtBQUssQ0FBQyxRQUFRO1FBQ3BCLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUFFLE9BQU8sSUFBSSxDQUFDLFdBQVksQ0FBQyxLQUFLLENBQUE7UUFFdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FB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