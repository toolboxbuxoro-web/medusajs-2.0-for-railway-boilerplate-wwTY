"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../../../lib/phone");
const otp_store_1 = require("../../../../../lib/otp-store");
const constants_1 = require("../../../../../lib/constants");
const jwt = __importStar(require("jsonwebtoken"));
function generatePassword() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone, code, cart_id } = (req.body || {});
    const purpose = "mobile_auth";
    if (!phone || !code) {
        return res.status(400).json({ error: "phone_and_code_required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid_phone" });
    }
    try {
        /**
         * 1. Verify OTP
         */
        const isVerified = await (0, otp_store_1.otpStoreVerify)(normalized, code.trim(), purpose);
        if (!isVerified) {
            return res.status(401).json({ error: "invalid_code_or_expired" });
        }
        const authModule = req.scope.resolve(utils_1.Modules.AUTH);
        const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
        const email = `${normalized}@phone.local`;
        /**
         * 2. Find or Create Customer
         */
        let customer;
        let authIdentityId = null;
        const existingCustomers = await customerModule.listCustomers({ email });
        if (existingCustomers.length > 0) {
            customer = existingCustomers[0];
            // Resolve existing auth identity
            const identities = await authModule.listAuthIdentities({
                provider_identities: {
                    entity_id: email,
                    provider: "emailpass",
                },
            });
            authIdentityId = identities[0]?.id;
        }
        else {
            // Register New Customer
            const password = generatePassword();
            const registerResult = await authModule.register("emailpass", {
                body: { email, password },
            });
            if (!registerResult?.success) {
                throw new Error("registration_failed");
            }
            authIdentityId = registerResult.authIdentity.id;
            customer = await customerModule.createCustomers({
                email,
                phone: `+${normalized}`,
                first_name: "Покупатель",
                has_account: true,
            });
            // Link Customer to Auth Identity
            await authModule.updateAuthIdentities([
                {
                    id: authIdentityId,
                    app_metadata: {
                        customer_id: customer.id,
                    },
                },
            ]);
        }
        if (!authIdentityId) {
            throw new Error("failed_to_resolve_auth_identity");
        }
        /**
         * 3. Bind Cart to Customer (if cart_id provided)
         */
        if (cart_id) {
            try {
                const cartModule = req.scope.resolve(utils_1.Modules.CART);
                await cartModule.updateCarts(cart_id, {
                    customer_id: customer.id,
                    email: customer.email,
                });
                logger.info(`[Mobile Auth] Bound cart ${cart_id} to customer ${customer.id}`);
            }
            catch (err) {
                logger.warn(`[Mobile Auth] Failed to bind cart ${cart_id}: ${err.message}`);
            }
        }
        /**
         * 4. Issue JWT Token
         * We follow Medusa 2.0 JWT format for Store API compatibility
         */
        const token = jwt.sign({
            actor_id: customer.id,
            auth_identity_id: authIdentityId,
            actor_type: "customer",
            domain: "store",
        }, constants_1.JWT_SECRET, { expiresIn: "30d" });
        logger.info(`[Mobile Auth] User ${normalized} logged in successfully`);
        return res.json({
            token,
            customer: {
                id: customer.id,
                email: customer.email,
                phone: customer.phone,
                first_name: customer.first_name,
                last_name: customer.last_name,
            }
        });
    }
    catch (error) {
        logger.error(`[Mobile Auth] Verification Error: ${error.message}`);
        return res.status(500).json({ error: "authentication_failed" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21vYmlsZS9hdXRoL3ZlcmlmeS1vdHAvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsb0JBa0lDO0FBbEpELHFEQUFtRDtBQUNuRCxvREFBMkQ7QUFDM0QsNERBQXNGO0FBQ3RGLDREQUF5RDtBQUN6RCxrREFBbUM7QUFRbkMsU0FBUyxnQkFBZ0I7SUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDL0QsQ0FBQztBQUVNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFTLENBQUE7SUFDekQsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFBO0lBRTdCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixFQUFFLENBQUMsQ0FBQTtJQUNuRSxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ3pELENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSDs7V0FFRztRQUNILE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSwwQkFBYyxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDekUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFBO1FBQ25FLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFRLENBQUE7UUFDekQsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFFBQVEsQ0FBUSxDQUFBO1FBRWpFLE1BQU0sS0FBSyxHQUFHLEdBQUcsVUFBVSxjQUFjLENBQUE7UUFFekM7O1dBRUc7UUFDSCxJQUFJLFFBQWEsQ0FBQTtRQUNqQixJQUFJLGNBQWMsR0FBa0IsSUFBSSxDQUFBO1FBRXhDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQTtRQUV2RSxJQUFJLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxRQUFRLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFL0IsaUNBQWlDO1lBQ2pDLE1BQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDO2dCQUNyRCxtQkFBbUIsRUFBRTtvQkFDbkIsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLFFBQVEsRUFBRSxXQUFXO2lCQUN0QjthQUNGLENBQUMsQ0FBQTtZQUNGLGNBQWMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFBO1FBQ3BDLENBQUM7YUFBTSxDQUFDO1lBQ04sd0JBQXdCO1lBQ3hCLE1BQU0sUUFBUSxHQUFHLGdCQUFnQixFQUFFLENBQUE7WUFDbkMsTUFBTSxjQUFjLEdBQUcsTUFBTSxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRTtnQkFDNUQsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRTthQUMxQixDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUE7WUFDeEMsQ0FBQztZQUVELGNBQWMsR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQTtZQUUvQyxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsZUFBZSxDQUFDO2dCQUM5QyxLQUFLO2dCQUNMLEtBQUssRUFBRSxJQUFJLFVBQVUsRUFBRTtnQkFDdkIsVUFBVSxFQUFFLFlBQVk7Z0JBQ3hCLFdBQVcsRUFBRSxJQUFJO2FBQ2xCLENBQUMsQ0FBQTtZQUVGLGlDQUFpQztZQUNqQyxNQUFNLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQztnQkFDcEM7b0JBQ0UsRUFBRSxFQUFFLGNBQWM7b0JBQ2xCLFlBQVksRUFBRTt3QkFDWixXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUU7cUJBQ3pCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7UUFDckQsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQztnQkFDSCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ2xELE1BQU0sVUFBVSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7b0JBQ3BDLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRTtvQkFDeEIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2lCQUN0QixDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsT0FBTyxnQkFBZ0IsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDL0UsQ0FBQztZQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMscUNBQXFDLE9BQU8sS0FBSyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUM3RSxDQUFDO1FBQ0gsQ0FBQztRQUVEOzs7V0FHRztRQUNILE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQ3BCO1lBQ0UsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ3JCLGdCQUFnQixFQUFFLGNBQWM7WUFDaEMsVUFBVSxFQUFFLFVBQVU7WUFDdEIsTUFBTSxFQUFFLE9BQU87U0FDaEIsRUFDRCxzQkFBVSxFQUNWLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUNyQixDQUFBO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsVUFBVSx5QkFBeUIsQ0FBQyxDQUFBO1FBRXRFLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLEtBQUs7WUFDTCxRQUFRLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNmLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7Z0JBQy9CLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUzthQUM5QjtTQUNGLENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBQ2xFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7QUFDSCxDQUFDIn0=