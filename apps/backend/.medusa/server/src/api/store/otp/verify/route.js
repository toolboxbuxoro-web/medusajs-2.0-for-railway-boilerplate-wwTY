"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const phone_1 = require("../../../../lib/phone");
const otp_store_1 = require("../../../../lib/otp-store");
/**
 * POST /store/otp/verify
 * Verify OTP code for phone number and purpose
 */
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone, code, purpose = "checkout" } = req.body;
    if (!phone || !code) {
        return res.status(400).json({ error: "phone_and_code_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    try {
        // Redis-based atomic verification (Lua script)
        // 1. Checks otp:{phone}:{purpose}
        // 2. If match: deletes otp:{phone}:{purpose} AND sets otp_verified:{phone}:{purpose} (TTL 30m)
        const success = await (0, otp_store_1.otpStoreVerify)(normalized, code.trim(), purpose);
        if (!success) {
            return res.status(400).json({
                error: "invalid_code",
            });
        }
        logger.info(`[OTP] Phone ${normalized} verified successfully for ${purpose}`);
        return res.json({
            success: true,
            verified: true
        });
    }
    catch (error) {
        logger.error(`[OTP] Error verifying OTP: ${error.message}`);
        return res.status(500).json({ error: "verification_failed" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL290cC92ZXJpZnkvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxvQkFvQ0M7QUEzQ0QsaURBQXdEO0FBQ3hELHlEQUEwRDtBQUUxRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDMUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxHQUFHLFVBQVUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUEyRCxDQUFBO0lBRTdHLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCwrQ0FBK0M7UUFDL0Msa0NBQWtDO1FBQ2xDLCtGQUErRjtRQUMvRixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsMEJBQWMsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBRXRFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzNCLEtBQUssRUFBRSxjQUFjO2FBQ3RCLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsVUFBVSw4QkFBOEIsT0FBTyxFQUFFLENBQUMsQ0FBQTtRQUU3RSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDM0QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUE7SUFDL0QsQ0FBQztBQUNILENBQUMifQ==