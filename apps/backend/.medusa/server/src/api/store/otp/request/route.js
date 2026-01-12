"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../lib/phone");
const otp_store_1 = require("../../../../lib/otp-store");
const _shared_1 = require("../_shared");
// Eskiz-approved SMS templates for each purpose
function getOtpMessage(code, purpose) {
    switch (purpose) {
        case "register":
            return `Kod podtverzhdeniya dlya registracii na sajte toolbox-tools.uz: ${code}`;
        case "reset_password":
            return `Kod dlya vosstanovleniya parolya na sajte toolbox-tools.uz: ${code}`;
        case "change_password":
            return `Kod dlya izmeneniya nomera telefona na sajte toolbox-tools.uz: ${code}`;
        case "checkout":
        default:
            return `Kod podtverzhdeniya dlya oformleniya zakaza na sajte toolbox-tools.uz: ${code}`;
    }
}
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone, purpose = "checkout" } = (req.body || {});
    if (!phone) {
        return res.status(400).json({ error: "phone is required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    // 1. If register, check if customer already exists
    if (purpose === "register") {
        const existing = await (0, _shared_1.findCustomerByPhone)(req, normalized);
        if (existing) {
            return res.status(400).json({ error: "account_exists" });
        }
    }
    // 2. Check Cooldown (60s)
    const isCooldownAllowed = await (0, otp_store_1.otpCooldownCheck)(normalized, purpose);
    if (!isCooldownAllowed) {
        return res.status(429).json({ error: "otp_cooldown" });
    }
    // 3. Redis-based rate limiting (atomic INCR per hour)
    const allowed = await (0, otp_store_1.otpRateLimitCheck)(normalized);
    if (!allowed) {
        return res.status(429).json({ error: "too_many_requests" });
    }
    const code = (0, otp_store_1.generateOtpCode)();
    await (0, otp_store_1.otpStoreSet)(normalized, code, purpose);
    // Use Eskiz-approved template format based on purpose
    const message = getOtpMessage(code, purpose);
    try {
        const notificationModule = req.scope.resolve(utils_1.Modules.NOTIFICATION);
        await notificationModule.createNotifications({
            to: `+${normalized}`,
            channel: "sms",
            template: "otp",
            data: {
                message
            }
        });
        return res.json({ success: true });
    }
    catch (error) {
        logger.error(`[OTP] Failed to send SMS: ${error.message}`);
        return res.status(500).json({ error: "failed_to_send_otp", debug_code: code });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL290cC9yZXF1ZXN0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBMEJBLG9CQXdEQztBQWpGRCxxREFBbUQ7QUFDbkQsaURBQXdEO0FBQ3hELHlEQUE2RztBQUM3Ryx3Q0FBZ0Q7QUFPaEQsZ0RBQWdEO0FBQ2hELFNBQVMsYUFBYSxDQUFDLElBQVksRUFBRSxPQUFnQjtJQUNuRCxRQUFRLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLEtBQUssVUFBVTtZQUNiLE9BQU8sbUVBQW1FLElBQUksRUFBRSxDQUFBO1FBQ2xGLEtBQUssZ0JBQWdCO1lBQ25CLE9BQU8sK0RBQStELElBQUksRUFBRSxDQUFBO1FBQzlFLEtBQUssaUJBQWlCO1lBQ3BCLE9BQU8sa0VBQWtFLElBQUksRUFBRSxDQUFBO1FBQ2pGLEtBQUssVUFBVSxDQUFDO1FBQ2hCO1lBQ0UsT0FBTywwRUFBMEUsSUFBSSxFQUFFLENBQUE7SUFDM0YsQ0FBQztBQUNILENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDMUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEdBQUcsVUFBVSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBUyxDQUFBO0lBRWhFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO0lBQzdELENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHdCQUFnQixFQUFDLEtBQUssQ0FBQyxDQUFBO0lB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