"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../lib/phone");
const otp_store_1 = require("../../../../lib/otp-store");
async function POST(req, res) {
    const { phone, code } = (req.body || {});
    const purpose = "change_phone";
    if (!phone || !code) {
        return res.status(400).json({ error: "phone_and_code_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    // 1. Verify OTP for the NEW phone
    const ok = await (0, otp_store_1.otpStoreVerify)(normalized, String(code), purpose);
    if (!ok) {
        return res.status(400).json({ error: "invalid_code" });
    }
    // 2. Resolve current customer from session
    const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
    const authModule = req.scope.resolve(utils_1.Modules.AUTH);
    // We assume the user is authenticated and we can get their ID from the request
    // In Medusa 2.0 with the default auth, the customer_id is usually in app_metadata
    const authIdentityId = req.auth_context?.auth_identity_id;
    if (!authIdentityId) {
        return res.status(401).json({ error: "unauthorized" });
    }
    try {
        const authIdentity = await authModule.retrieveAuthIdentity(authIdentityId);
        const customerId = authIdentity.app_metadata?.customer_id;
        if (!customerId) {
            return res.status(400).json({ error: "customer_not_found" });
        }
        const newEmail = `${normalized}@phone.local`;
        // 3. Check if the new phone/email already exists
        const existing = await customerModule.listCustomers({ email: newEmail });
        if (existing.length > 0) {
            return res.status(400).json({ error: "phone_already_in_use" });
        }
        // 4. Atomic Consumption of OTP
        await (0, otp_store_1.otpStoreConsumeVerified)(normalized, purpose);
        // 5. Update Customer
        await customerModule.updateCustomers(customerId, {
            phone: `+${normalized}`,
            email: newEmail
        });
        // 6. Update Auth Identity
        await authModule.updateProvider("emailpass", {
            entity_id: authIdentity.provider_identities[0].entity_id, // old email
            update_entity_id: newEmail // new email
        });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: "operation_failed" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL290cC9jaGFuZ2UtcGhvbmUvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxvQkFrRUM7QUEzRUQscURBQW1EO0FBQ25ELGlEQUF3RDtBQUN4RCx5REFBbUY7QUFPNUUsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBUyxDQUFBO0lBQ2hELE1BQU0sT0FBTyxHQUFHLGNBQWMsQ0FBQTtJQUU5QixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSx5QkFBeUIsRUFBRSxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUEsd0JBQWdCLEVBQUMsS0FBSyxDQUFDLENBQUE7SUFDMUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBQSwwQkFBYyxFQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDbEUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ1IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVB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