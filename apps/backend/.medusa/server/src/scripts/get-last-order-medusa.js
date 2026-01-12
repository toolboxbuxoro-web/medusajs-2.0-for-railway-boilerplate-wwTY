"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = main;
const utils_1 = require("@medusajs/framework/utils");
async function main({ container }) {
    const orderModuleService = container.resolve(utils_1.Modules.ORDER);
    const [orders] = await orderModuleService.listAndCountOrders({}, { take: 1, order: { created_at: "DESC" } });
    if (orders.length > 0) {
        console.log(`LATEST_ORDER_ID=${orders[0].id}`);
        console.log(`DISPLAY_ID=${orders[0].display_id}`);
    }
    else {
        console.log("No orders found.");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWxhc3Qtb3JkZXItbWVkdXNhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvZ2V0LWxhc3Qtb3JkZXItbWVkdXNhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsdUJBY0M7QUFoQkQscURBQW1EO0FBRXBDLEtBQUssVUFBVSxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQVk7SUFDeEQsTUFBTSxrQkFBa0IsR0FBd0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFaEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sa0JBQWtCLENBQUMsa0JBQWtCLENBQzFELEVBQUUsRUFDRixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQzNDLENBQUE7SUFFRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO0lBQ25ELENBQUM7U0FBTSxDQUFDO1FBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0lBQ2pDLENBQUM7QUFDSCxDQUFDIn0=