"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../../lib/phone");
const otp_store_1 = require("../../../../../lib/otp-store");
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone } = (req.body || {});
    const purpose = "mobile_auth";
    if (!phone) {
        return res.status(400).json({ error: "phone_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    // 1. Check Cooldown (60s)
    const isCooldownAllowed = await (0, otp_store_1.otpCooldownCheck)(normalized, purpose);
    if (!isCooldownAllowed) {
        return res.status(429).json({ error: "otp_cooldown" });
    }
    // 2. Redis-based rate limiting (atomic INCR per hour)
    const allowed = await (0, otp_store_1.otpRateLimitCheck)(normalized);
    if (!allowed) {
        return res.status(429).json({ error: "too_many_requests" });
    }
    const code = (0, otp_store_1.generateOtpCode)();
    await (0, otp_store_1.otpStoreSet)(normalized, code, purpose);
    const message = `Kod podtverzhdeniya dlya vhoda v prilozhenie Toolbox: ${code}`;
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
        logger.info(`[Mobile Auth] OTP sent to ${normalized}`);
        return res.json({ success: true });
    }
    catch (error) {
        logger.error(`[Mobile Auth] Failed to send SMS: ${error.message}`);
        // For local dev, we might want to return the code in error for easier testing, but not in production
        return res.status(500).json({
            error: "failed_to_send_otp",
            ...(process.env.NODE_ENV === 'development' && { debug_code: code })
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21vYmlsZS9hdXRoL3JlcXVlc3Qtb3RwL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBU0Esb0JBcURDO0FBN0RELHFEQUFtRDtBQUNuRCxvREFBMkQ7QUFDM0QsNERBQWdIO0FBTXpHLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBUyxDQUFBO0lBQzFDLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQTtJQUU3QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtJQUMxRCxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUEsNEJBQWdCLEVBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ3JFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSw2QkFBaUIsRUFBQyxVQUFVLENBQUMsQ0FBQTtJQUNuRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDYixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtJQUM3RCxDQUFDO0lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBQSwyQkFBZSxHQUFFLENBQUE7SUFDOUIsTUFBTSxJQUFBLHVCQUFXLEVBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUU1QyxNQUFNLE9BQU8sR0FBRyx5REFBeUQsSUFBSSxFQUFFLENBQUE7SUFFL0UsSUFBSSxDQUFDO1FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFbEUsTUFBTSxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQztZQUMzQyxFQUFFLEVBQUUsSUFBSSxVQUFVLEVBQUU7WUFDcEIsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsS0FBSztZQUNmLElBQUksRUFBRTtnQkFDSixPQUFPO2FBQ1I7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixVQUFVLEVBQUUsQ0FBQyxDQUFBO1FBQ3RELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLHFHQUFxRztRQUNyRyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLEtBQUssRUFBRSxvQkFBb0I7WUFDM0IsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLGFBQWEsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztTQUNwRSxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9