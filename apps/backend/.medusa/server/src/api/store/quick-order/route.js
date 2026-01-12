"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const phone_1 = require("../../../lib/phone");
function generatePassword() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { phone, first_name } = (req.body || {});
    if (!phone) {
        return res.status(400).json({ error: "phone is required" });
    }
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized) {
        return res.status(400).json({ error: "invalid phone format" });
    }
    const email = `${normalized}@phone.local`;
    const password = generatePassword();
    const cartId = req.headers["x-cart-id"];
    if (!cartId) {
        return res.status(400).json({ error: "Корзина пуста. Добавьте товар в корзину." });
    }
    try {
        const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
        const authModule = req.scope.resolve(utils_1.Modules.AUTH);
        const cartModule = req.scope.resolve(utils_1.Modules.CART);
        // Check if customer exists by email (phone-based synthetic email)
        const existingCustomers = await customerModule.listCustomers({ email });
        let customer = existingCustomers?.[0];
        let isNewCustomer = false;
        if (!customer) {
            isNewCustomer = true;
            // 1. Create Auth Identity
            let authIdentityId = null;
            try {
                const authResult = await authModule.register("emailpass", {
                    body: { email, password },
                });
                authIdentityId = authResult?.authIdentity?.id || null;
                logger.info(`[quick-order] Created auth identity: ${authIdentityId}`);
            }
            catch (e) {
                if (!e.message?.includes("already exists")) {
                    logger.warn(`[quick-order] Auth register warning: ${e.message}`);
                }
            }
            // 2. Create Customer
            customer = await customerModule.createCustomers({
                email,
                first_name: first_name || "Покупатель",
                last_name: "",
                phone: `+${normalized}`,
                has_account: true,
            });
            logger.info(`[quick-order] Created customer: ${customer.id}`);
            // 3. CRITICAL: Link Auth Identity to Customer via app_metadata
            // In Medusa v2, the link is done by setting actor_id in auth_identity's app_metadata
            if (authIdentityId && customer?.id) {
                try {
                    await authModule.updateAuthIdentities([{
                            id: authIdentityId,
                            app_metadata: {
                                customer_id: customer.id,
                            },
                        }]);
                    logger.info(`[quick-order] Linked auth ${authIdentityId} -> customer ${customer.id} via app_metadata`);
                }
                catch (linkError) {
                    logger.error(`[quick-order] Failed to update auth identity app_metadata: ${linkError.message}`);
                    // Fallback: Try direct SQL update
                    try {
                        const pgConnection = req.scope.resolve("__pg_connection__");
                        await pgConnection.raw(`
              UPDATE auth_identity 
              SET app_metadata = jsonb_set(COALESCE(app_metadata, '{}'), '{customer_id}', $1::jsonb)
              WHERE id = $2
            `, [JSON.stringify(customer.id), authIdentityId]);
                        logger.info(`[quick-order] Linked via SQL fallback`);
                    }
                    catch (sqlError) {
                        logger.error(`[quick-order] SQL fallback also failed: ${sqlError.message}`);
                    }
                }
            }
        }
        // Get existing cart using remoteQuery
        let cart;
        try {
            const remoteQuery = req.scope.resolve("remoteQuery");
            const carts = await remoteQuery({
                entryPoint: "cart",
                fields: [
                    "id",
                    "currency_code",
                    "region_id",
                    "total",
                    "payment_collection_id",
                    "items.id",
                    "items.variant_id",
                    "items.quantity",
                    "items.unit_price",
                    "items.total",
                    "items.title",
                    "metadata",
                    "region.id",
                    "region.name",
                    "region.currency_code",
                    "shipping_methods.id",
                    "shipping_methods.shipping_option_id",
                    "shipping_methods.amount"
                ],
                variables: { id: cartId }
            });
            cart = carts?.[0];
            if (!cart) {
                logger.error(`[quick-order] Cart not found with remoteQuery: ${cartId}`);
                return res.status(400).json({ error: "Корзина не найдена. Пожалуйста, попробуйте добавить товар еще раз." });
            }
        }
        catch (e) {
            logger.error(`[quick-order] Error retrieving cart ${cartId}: ${e.message}`);
            return res.status(400).json({ error: "Ошибка при чтении корзины" });
        }
        if (!cart.items?.length) {
            logger.warn(`[quick-order] Cart ${cartId} has no items`);
            return res.status(400).json({ error: "Корзина пуста" });
        }
        // Prepare metadata update
        const metadataUpdate = {
            ...cart.metadata,
            is_quick_order: true,
            is_new_customer: isNewCustomer,
            // TEMP: Always include password for testing
            tmp_generated_password: password,
        };
        // Update cart
        await cartModule.updateCarts(cartId, {
            email,
            customer_id: customer.id,
            shipping_address: {
                first_name: first_name || "Покупатель",
                last_name: "",
                phone: `+${normalized}`,
                address_1: "Будет уточнен при звонке",
                city: "Ташкент",
                country_code: "uz",
                postal_code: "100000",
            },
            billing_address: {
                first_name: first_name || "Покупатель",
                last_name: "",
                phone: `+${normalized}`,
                address_1: "Будет уточнен при звонке",
                city: "Ташкент",
                country_code: "uz",
                postal_code: "100000",
            },
            metadata: metadataUpdate
        });
        logger.info(`[quick-order] Initialized cart ${cartId} for customer ${customer.id}, metadata includes tmp_generated_password=${!!password}`);
        return res.json({
            success: true,
            cart_id: cartId,
            customer_id: customer.id,
            is_new_customer: isNewCustomer,
        });
    }
    catch (error) {
        logger.error(`[quick-order] Error: ${error?.message || error}`);
        return res.status(500).json({
            success: false,
            error: error?.message || "Ошибка оформления заказа"
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3F1aWNrLW9yZGVyL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBYUEsb0JBd0xDO0FBcE1ELHFEQUE4RTtBQUM5RSw4Q0FBcUQ7QUFPckQsU0FBUyxnQkFBZ0I7SUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDL0QsQ0FBQztBQUVNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQVMsQ0FBQTtJQUV0RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtJQUM3RCxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxDQUFDLENBQUE7SUFDaEUsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLEdBQUcsVUFBVSxjQUFjLENBQUE7SUFDekMsTUFBTSxRQUFRLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQTtJQUVuQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBVyxDQUFBO0lBQ2pELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNaLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsMENBQTBDLEVBQUUsQ0FBQyxDQUFBO0lBQ3BGLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDMUQsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBUSxDQUFBO1FBQ3pELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVsRCxrRUFBa0U7UUFDbEUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLGNBQWMsQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZFLElBQUksUUFBUSxHQUFHLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDckMsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFBO1FBRXpCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLGFBQWEsR0FBRyxJQUFJLENBQUE7WUFFcEIsMEJBQTBCO1lBQzFCLElBQUksY0FBYyxHQUFrQixJQUFJLENBQUE7WUFDeEMsSUFBSSxDQUFDO2dCQUNILE1BQU0sVUFBVSxHQUFHLE1BQU0sVUFBVSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7b0JBQ3hELElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7aUJBQzFCLENBQUMsQ0FBQTtnQkFDRixjQUFjLEdBQUcsVUFBVSxFQUFFLFlBQVksRUFBRSxFQUFFLElBQUksSUFBSSxDQUFBO2dCQUNyRCxNQUFNLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxjQUFjLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZFLENBQUM7WUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO29CQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdDQUF3QyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtnQkFDbEUsQ0FBQztZQUNILENBQUM7WUFFRCxxQkFBcUI7WUFDckIsUUFBUSxHQUFHLE1BQU0sY0FBYyxDQUFDLGVBQWUsQ0FBQztnQkFDOUMsS0FBSztnQkFDTCxVQUFVLEVBQUUsVUFBVSxJQUFJLFlBQVk7Z0JBQ3RDLFNBQVMsRUFBRSxFQUFFO2dCQUNiLEtBQUssRUFBRSxJQUFJLFVBQVUsRUFBRTtnQkFDdkIsV0FBVyxFQUFFLElBQUk7YUFDbEIsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFFN0QsK0RBQStEO1lBQy9ELHFGQUFxRjtZQUNyRixJQUFJLGNBQWMsSUFBSSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQztvQkFDSCxNQUFNLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOzRCQUNyQyxFQUFFLEVBQUUsY0FBYzs0QkFDbEIsWUFBWSxFQUFFO2dDQUNaLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRTs2QkFDekI7eUJBQ0YsQ0FBQyxDQUFDLENBQUE7b0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsY0FBYyxnQkFBZ0IsUUFBUSxDQUFDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtnQkFDeEcsQ0FBQztnQkFBQyxPQUFPLFNBQWMsRUFBRSxDQUFDO29CQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLDhEQUE4RCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtvQkFFL0Ysa0NBQWtDO29CQUNsQyxJQUFJLENBQUM7d0JBQ0gsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQTt3QkFDM0QsTUFBTSxZQUFZLENBQUMsR0FBRyxDQUFDOzs7O2FBSXRCLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFBO3dCQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUE7b0JBQ3RELENBQUM7b0JBQUMsT0FBTyxRQUFhLEVBQUUsQ0FBQzt3QkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7b0JBQzdFLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBRUQsc0NBQXNDO1FBQ3RDLElBQUksSUFBUyxDQUFBO1FBQ2IsSUFBSSxDQUFDO1lBQ0gsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7WUFFcEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxXQUFXLENBQUM7Z0JBQzlCLFVBQVUsRUFBRSxNQUFNO2dCQUNsQixNQUFNLEVBQUU7b0JBQ04sSUFBSTtvQkFDSixlQUFlO29CQUNmLFdBQVc7b0JBQ1gsT0FBTztvQkFDUCx1QkFBdUI7b0JBQ3ZCLFVBQVU7b0JBQ1Ysa0JBQWtCO29CQUNsQixnQkFBZ0I7b0JBQ2hCLGtCQUFrQjtvQkFDbEIsYUFBYTtvQkFDYixhQUFhO29CQUNiLFVBQVU7b0JBQ1YsV0FBVztvQkFDWCxhQUFhO29CQUNiLHNCQUFzQjtvQkFDdEIscUJBQXFCO29CQUNyQixxQ0FBcUM7b0JBQ3JDLHlCQUF5QjtpQkFDMUI7Z0JBQ0QsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRTthQUMxQixDQUFDLENBQUE7WUFFRixJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFakIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNWLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0RBQWtELE1BQU0sRUFBRSxDQUFDLENBQUE7Z0JBQ3hFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsb0VBQW9FLEVBQUUsQ0FBQyxDQUFBO1lBQzlHLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztZQUNoQixNQUFNLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxNQUFNLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7WUFDM0UsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxDQUFDLENBQUE7UUFDckUsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLE1BQU0sZUFBZSxDQUFDLENBQUE7WUFDeEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQ3pELENBQUM7UUFFRCwwQkFBMEI7UUFDMUIsTUFBTSxjQUFjLEdBQUc7WUFDbkIsR0FBRyxJQUFJLENBQUMsUUFBUTtZQUNoQixjQUFjLEVBQUUsSUFBSTtZQUNwQixlQUFlLEVBQUUsYUFBYTtZQUM5Qiw0Q0FBNEM7WUFDNUMsc0JBQXNCLEVBQUUsUUFBUTtTQUM1QixDQUFBO1FBRVIsY0FBYztRQUNkLE1BQU0sVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7WUFDbkMsS0FBSztZQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRTtZQUN4QixnQkFBZ0IsRUFBRTtnQkFDaEIsVUFBVSxFQUFFLFVBQVUsSUFBSSxZQUFZO2dCQUN0QyxTQUFTLEVBQUUsRUFBRTtnQkFDYixLQUFLLEVBQUUsSUFBSSxVQUFVLEVBQUU7Z0JBQ3ZCLFNBQVMsRUFBRSwwQkFBMEI7Z0JBQ3JDLElBQUksRUFBRSxTQUFTO2dCQUNmLFlBQVksRUFBRSxJQUFJO2dCQUNsQixXQUFXLEVBQUUsUUFBUTthQUN0QjtZQUNELGVBQWUsRUFBRTtnQkFDZixVQUFVLEVBQUUsVUFBVSxJQUFJLFlBQVk7Z0JBQ3RDLFNBQVMsRUFBRSxFQUFFO2dCQUNiLEtBQUssRUFBRSxJQUFJLFVBQVUsRUFBRTtnQkFDdkIsU0FBUyxFQUFFLDBCQUEwQjtnQkFDckMsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLFdBQVcsRUFBRSxRQUFRO2FBQ3RCO1lBQ0QsUUFBUSxFQUFFLGNBQWM7U0FDekIsQ0FBQyxDQUFBO1FBRUYsTUFBTSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsTUFBTSxpQkFBaUIsUUFBUSxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBRTNJLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLE1BQU07WUFDZixXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDeEIsZUFBZSxFQUFFLGFBQWE7U0FDL0IsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsS0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQy9ELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sSUFBSSwwQkFBMEI7U0FDcEQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==