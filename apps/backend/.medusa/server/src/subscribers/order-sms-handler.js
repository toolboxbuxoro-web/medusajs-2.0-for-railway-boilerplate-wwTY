"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = orderSmsHandler;
const utils_1 = require("@medusajs/framework/utils");
async function orderSmsHandler({ event: { data }, container, }) {
    const logger = container.resolve("logger");
    const notificationModule = container.resolve(utils_1.Modules.NOTIFICATION);
    const orderModule = container.resolve(utils_1.Modules.ORDER);
    const orderId = data.id;
    try {
        // 1. Retrieve order with all necessary relations
        // Note: 'customer' is NOT a valid relation on Order in Medusa v2
        const order = await orderModule.retrieveOrder(orderId, {
            relations: ["summary", "shipping_address", "items"]
        });
        logger.info(`[order-sms-handler] Processing order ${orderId}, order.metadata: ${JSON.stringify(order.metadata || {})}`);
        // 2. Identify if this is a new customer/quick order and get the password
        let isQuickOrder = order.metadata?.is_quick_order;
        let tmpPassword = order.metadata?.tmp_generated_password;
        // If not in order.metadata, try to fetch from cart via DB query
        if (!tmpPassword) {
            try {
                const pgConnection = container.resolve("__pg_connection__");
                const queries = [
                    {
                        name: "order.cart_id direct",
                        sql: `SELECT c.metadata FROM cart c 
                  JOIN "order" o ON o.cart_id = c.id 
                  WHERE o.id = $1`
                    },
                    {
                        name: "via payment_collection",
                        sql: `SELECT c.metadata FROM cart c 
                  JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
                  JOIN "order" o ON o.payment_collection_id = cpc.payment_collection_id
                  WHERE o.id = $1`
                    },
                    {
                        name: "by email match",
                        sql: `SELECT c.metadata FROM cart c 
                  JOIN "order" o ON o.email = c.email
                  WHERE o.id = $1
                  ORDER BY c.created_at DESC LIMIT 1`
                    }
                ];
                for (const { name, sql } of queries) {
                    try {
                        const result = await pgConnection.raw(sql, [orderId]);
                        const rows = result?.rows || result || [];
                        const cartMetadata = rows?.[0]?.metadata;
                        if (cartMetadata) {
                            const meta = typeof cartMetadata === 'string' ? JSON.parse(cartMetadata) : cartMetadata;
                            if (meta?.tmp_generated_password) {
                                tmpPassword = meta.tmp_generated_password;
                                isQuickOrder = meta.is_quick_order || isQuickOrder;
                                logger.info(`[order-sms-handler] Found password via database (${name})`);
                                break;
                            }
                        }
                    }
                    catch (e) {
                        // Silently fail as we have multiple query approaches
                    }
                }
            }
            catch (e) {
                logger.error(`[order-sms-handler] Error querying DB for cart metadata: ${e.message}`);
            }
        }
        // 3. Robust Phone Resolution Logic
        // Fallback priority: 
        // 1) Shipping address (best for delivery)
        // 2) Order metadata (special cases like quick order)
        const orderAny = order;
        const rawPhone = orderAny.shipping_address?.phone ||
            orderAny.metadata?.phone ||
            orderAny.metadata?.quick_order_phone ||
            "";
        const normalized = rawPhone.replace(/\D/g, "");
        logger.info(`[order-sms-handler] Resolution: phone=${normalized}, isQuickOrder=${!!isQuickOrder}, hasPassword=${!!tmpPassword}`);
        if (!normalized) {
            logger.warn(`[order-sms-handler] Skip SMS: No phone number resolved for order ${orderId}`);
            return;
        }
        // 4. Send Credentials SMS (Username/Password)
        if (tmpPassword) {
            try {
                const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${tmpPassword}`;
                await notificationModule.createNotifications({
                    to: normalized,
                    channel: "sms",
                    template: "quick-order-credentials",
                    data: { message: smsMessage }
                });
                logger.info(`[order-sms-handler] Successfully sent credentials SMS to +${normalized}`);
            }
            catch (e) {
                logger.error(`[order-sms-handler] Failed to send credentials SMS: ${e.message}`);
            }
        }
        // 5. Send Order Confirmation SMS
        try {
            // Use summary total or fallback to raw total
            const total = Number(order.summary?.current_order_total || order.total || 0);
            const totalFormatted = new Intl.NumberFormat("ru-RU").format(total);
            const orderDisplayId = order.display_id || orderId.slice(-8);
            const smsMessage = `Vash zakaz #${orderDisplayId} na sajte toolbox-tools.uz uspeshno oformlen. Summa: ${totalFormatted} UZS`;
            await notificationModule.createNotifications({
                to: normalized,
                channel: "sms",
                template: "order-confirmation",
                data: { message: smsMessage }
            });
            logger.info(`[order-sms-handler] Successfully sent confirmation SMS to +${normalized}`);
        }
        catch (e) {
            logger.error(`[order-sms-handler] Failed to send confirmation SMS: ${e.message}`);
        }
    }
    catch (error) {
        logger.error(`[order-sms-handler] Error processing order ${orderId}: ${error.message}`);
    }
}
exports.config = {
    event: "order.placed",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JkZXItc21zLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvb3JkZXItc21zLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0Esa0NBd0lDO0FBMUlELHFEQUFtRDtBQUVwQyxLQUFLLFVBQVUsZUFBZSxDQUFDLEVBQzVDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUNmLFNBQVMsR0FDc0I7SUFDL0IsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO0lBQ2xFLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRXBELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7SUFFdkIsSUFBSSxDQUFDO1FBQ0gsaURBQWlEO1FBQ2pELGlFQUFpRTtRQUNqRSxNQUFNLEtBQUssR0FBRyxNQUFNLFdBQVcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQ3JELFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLENBQUM7U0FDcEQsQ0FBQyxDQUFBO1FBRUYsTUFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsT0FBTyxxQkFBcUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUV2SCx5RUFBeUU7UUFDekUsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUE7UUFDakQsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxzQkFBZ0MsQ0FBQTtRQUVsRSxnRUFBZ0U7UUFDaEUsSUFBSSxDQUFDLFdB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