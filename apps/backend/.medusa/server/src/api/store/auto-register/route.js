"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../lib/phone");
const otp_store_1 = require("../../../lib/otp-store");
function generatePassword() {
    // 6-digit numeric password (SMS-friendly)
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone, first_name, last_name, cart_id } = (req.body || {});
    const purpose = "checkout"; // auto-register is currently linked to checkout flow
    if (!phone) {
        return res.status(400).json({ error: "phone is required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid phone format" });
    }
    const email = `${normalized}@phone.local`;
    const password = generatePassword();
    try {
        /**
         * 1. Consume OTP verification (ONE-TIME, ATOMIC)
         */
        const isVerified = await (0, otp_store_1.otpStoreConsumeVerified)(normalized, purpose);
        if (!isVerified) {
            return res.status(400).json({
                error: "phone_not_verified"
            });
        }
        const authModule = req.scope.resolve(utils_1.Modules.AUTH);
        const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
        /**
         * 2. Resolve existing customer (by phone-based email)
         */
        const existingCustomers = await customerModule.listCustomers({ email });
        let customerId;
        let authIdentityId = null;
        if (existingCustomers.length > 0) {
            /**
             * EXISTING CUSTOMER
             * → reset password
             * → guarantee SMS delivery
             */
            const customer = existingCustomers[0];
            customerId = customer.id;
            // Try to update password for existing auth identity
            const updateResult = await authModule.updateProvider("emailpass", {
                entity_id: email,
                password,
            });
            if (!updateResult?.success) {
                // If identity does not exist — register it
                const registerResult = await authModule.register("emailpass", {
                    body: { email, password },
                });
                if (!registerResult?.success) {
                    throw new Error("auth_identity_update_failed");
                }
                authIdentityId = registerResult.authIdentity.id;
            }
        }
        else {
            /**
             * NEW CUSTOMER
             * → create auth identity
             * → create customer
             */
            const registerResult = await authModule.register("emailpass", {
                body: { email, password },
            });
            if (!registerResult?.success) {
                throw new Error("registration_failed");
            }
            authIdentityId = registerResult.authIdentity.id;
            const customer = await customerModule.createCustomers({
                email,
                first_name: first_name || "Покупатель",
                last_name: last_name || "",
                phone: `+${normalized}`,
                has_account: true,
            });
            customerId = customer.id;
        }
        /**
         * 3. Ensure authIdentity ↔ customer link
         */
        if (!authIdentityId) {
            const identities = await authModule.listAuthIdentities({
                provider_identities: {
                    entity_id: email,
                    provider: "emailpass",
                },
            });
            authIdentityId = identities[0]?.id;
        }
        if (authIdentityId && customerId) {
            await authModule.updateAuthIdentities([
                {
                    id: authIdentityId,
                    app_metadata: {
                        customer_id: customerId,
                    },
                },
            ]);
        }
        /**
         * 4. Centralized SMS Logic:
         * We no longer send SMS here. Instead, we save credentials to the cart metadata
         * if cart_id is provided. order-sms-handler.ts will send the credentials
         * once the order is placed.
         */
        if (cart_id) {
            const cartModule = req.scope.resolve(utils_1.Modules.CART);
            try {
                const [cart] = await cartModule.listCarts({ id: cart_id });
                if (cart) {
                    await cartModule.updateCarts(cart_id, {
                        metadata: {
                            ...cart.metadata,
                            tmp_generated_password: password,
                            is_new_customer: true,
                        }
                    });
                    logger.info(`[auto-register] Updated cart ${cart_id} with credentials metadata`);
                }
            }
            catch (err) {
                logger.warn(`[auto-register] Failed to update cart metadata: ${err.message}`);
            }
        }
        /**
         * 5. SUCCESS
         * auto-register does NOT log in the user
         * it only guarantees account + credentials delivery
         */
        return res.json({
            success: true,
            customer_id: customerId,
        });
    }
    catch (error) {
        logger.error("[auto-register] Error:", error);
        return res.status(500).json({
            error: error?.message || "registration_failed",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dG8tcmVnaXN0ZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFpQkEsb0JBOEpDO0FBOUtELHFEQUFtRDtBQUNuRCw4Q0FBcUQ7QUFDckQsc0RBQWdFO0FBU2hFLFNBQVMsZ0JBQWdCO0lBQ3ZCLDBDQUEwQztJQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtBQUMvRCxDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFTLENBQUE7SUFDMUUsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFBLENBQUMscURBQXFEO0lBRWhGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO0lBQzdELENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFBLHdCQUFnQixFQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNoQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHNCQUFzQixFQUFFLENBQUMsQ0FBQTtJQUNoRSxD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