"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../lib/phone");
const otp_store_1 = require("../../../../lib/otp-store");
const _shared_1 = require("../_shared");
async function POST(req, res) {
    const { phone, code, new_password } = (req.body || {});
    const purpose = "reset_password";
    if (!phone || !code || !new_password) {
        return res.status(400).json({ error: "phone_code_password_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    const technicalEmail = `${normalized}@phone.local`;
    // Step 1: Verify OTP (this consumes the OTP code in Redis and sets the verified flag)
    const ok = await (0, otp_store_1.otpStoreVerify)(normalized, String(code), purpose);
    if (!ok) {
        return res.status(400).json({ error: "invalid_code" });
    }
    // Step 2: Consume the verification flag to prevent reuse in the same request or future ones
    const consumed = await (0, otp_store_1.otpStoreConsumeVerified)(normalized, purpose);
    if (!consumed) {
        return res.status(400).json({ error: "expired_code" });
    }
    const customer = await (0, _shared_1.findCustomerByPhone)(req, phone);
    if (!customer?.email) {
        return res.status(400).json({ error: "customer_not_found" });
    }
    const auth = req.scope.resolve(utils_1.Modules.AUTH);
    // Try to update password first (most common case)
    const updateResult = await auth.updateProvider("emailpass", {
        entity_id: customer.email,
        password: new_password,
    });
    if (!updateResult?.success) {
        // If identity does not exist — register it
        const registerResult = await auth.register("emailpass", {
            body: { email: customer.email, password: new_password },
        });
        if (!registerResult?.success) {
            return res.status(400).json({ error: "password_update_failed" });
        }
    }
    return res.json({ success: true });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL290cC9yZXNldC1wYXNzd29yZC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVlBLG9CQW9EQztBQS9ERCxxREFBbUQ7QUFDbkQsaURBQXdEO0FBQ3hELHlEQUFtRjtBQUNuRix3Q0FBZ0Q7QUFRekMsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQVMsQ0FBQTtJQUM5RCxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQTtJQUVoQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSw4QkFBOEIsRUFBRSxDQUFDLENBQUE7SUFDeEUsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUEsd0JBQWdCLEVBQUMsS0FBSyxDQUFDLENBQUE7SUFDMUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0lBRUQsTUFBTSxjQUFjLEdBQUcsR0FBRyxVQUFVLGNBQWMsQ0FBQTtJQUVsRCxzRkFBc0Y7SUFDdEYsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFBLDBCQUFjLEVBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNsRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDUixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7SUFDeEQsQ0FBQztJQUVELDRGQUE0RjtJQUM1RixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsbUNBQXVCLEVBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ25FLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNkLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLDZCQUFtQixFQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN0RCxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3JCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFBO0lBQzlELENBQUM7SUFFRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFRLENBQUE7SUFFbkQsa0RBQWtEO0lBQ2xELE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUU7UUFDMUQsU0FBUyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1FBQ3pCLFFBQVEsRUFBRSxZQUFZO0tBQ3ZCLENBQUMsQ0FBQTtJQUVGLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDM0IsMkNBQTJDO1FBQzNDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7WUFDdEQsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRTtTQUN4RCxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzdCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7QUFDcEMsQ0FBQyJ9