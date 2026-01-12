"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../lib/phone");
const otp_store_1 = require("../../../../lib/otp-store");
const _shared_1 = require("../_shared");
async function POST(req, res) {
    const { phone, code, old_password, new_password } = (req.body || {});
    const purpose = "change_password";
    if (!phone || !code || !old_password || !new_password) {
        return res.status(400).json({ error: "phone_code_password_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    const ok = await (0, otp_store_1.otpStoreVerify)(normalized, String(code), purpose);
    if (!ok) {
        return res.status(400).json({ error: "invalid_code" });
    }
    // 2. Resolve current customer from session
    const authIdentityId = req.auth_context?.auth_identity_id;
    if (!authIdentityId) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const customer = await (0, _shared_1.findCustomerByPhone)(req, phone);
    if (!customer?.email) {
        return res.status(400).json({ error: "customer_not_found" });
    }
    const auth = req.scope.resolve(utils_1.Modules.AUTH);
    try {
        const authResp = await auth.authenticate("emailpass", {
            body: { email: customer.email, password: old_password },
        });
        if (!authResp?.success) {
            return res.status(400).json({ error: "invalid_old_password" });
        }
        const updateResp = await auth.updateProvider("emailpass", {
            entity_id: customer.email,
            password: new_password,
        });
        if (!updateResp?.success) {
            return res.status(400).json({ error: "password_update_failed" });
        }
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(400).json({ error: "operation_failed" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL290cC9jaGFuZ2UtcGFzc3dvcmQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSxvQkFxREM7QUFqRUQscURBQW1EO0FBQ25ELGlEQUF3RDtBQUN4RCx5REFBMEQ7QUFDMUQsd0NBQWdEO0FBU3pDLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBUyxDQUFBO0lBQzVFLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFBO0lBRWpDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN0RCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUFFLENBQUMsQ0FBQTtJQUN4RSxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRCxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsMEJBQWMsRUFBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ2xFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNSLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRUQsMkNBQTJDO0lBQzNDLE1BQU0sY0FBYyxHQUFJLEdBQVcsQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLENBQUE7SUFDbEUsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLDZCQUFtQixFQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN0RCxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO1FBQ3JCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxDQUFBO0lBQzlELENBQUM7SUFFRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFRLENBQUE7SUFFbkQsSUFBSSxDQUFDO1FBQ0YsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRTtZQUNyRCxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFO1NBQ3hELENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDdkIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUE7UUFDaEUsQ0FBQztRQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUU7WUFDeEQsU0FBUyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1lBQ3pCLFFBQVEsRUFBRSxZQUFZO1NBQ3ZCLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDekIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUE7UUFDbEUsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFBO0lBQzVELENBQUM7QUFDSCxDQUFDIn0=