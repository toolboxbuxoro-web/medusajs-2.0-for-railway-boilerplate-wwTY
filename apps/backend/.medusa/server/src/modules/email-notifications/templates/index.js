"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPlacedTemplate = exports.InviteUserEmail = exports.EmailTemplates = void 0;
exports.generateEmailTemplate = generateEmailTemplate;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("@medusajs/framework/utils");
const invite_user_1 = require("./invite-user");
Object.defineProperty(exports, "InviteUserEmail", { enumerable: true, get: function () { return invite_user_1.InviteUserEmail; } });
const order_placed_1 = require("./order-placed");
Object.defineProperty(exports, "OrderPlacedTemplate", { enumerable: true, get: function () { return order_placed_1.OrderPlacedTemplate; } });
exports.EmailTemplates = {
    INVITE_USER: invite_user_1.INVITE_USER,
    ORDER_PLACED: order_placed_1.ORDER_PLACED
};
function generateEmailTemplate(templateKey, data) {
    switch (templateKey) {
        case exports.EmailTemplates.INVITE_USER:
            if (!(0, invite_user_1.isInviteUserData)(data)) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Invalid data for template "${exports.EmailTemplates.INVITE_USER}"`);
            }
            return (0, jsx_runtime_1.jsx)(invite_user_1.InviteUserEmail, { ...data });
        case exports.EmailTemplates.ORDER_PLACED:
            if (!(0, order_placed_1.isOrderPlacedTemplateData)(data)) {
                throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Invalid data for template "${exports.EmailTemplates.ORDER_PLACED}"`);
            }
            return (0, jsx_runtime_1.jsx)(order_placed_1.OrderPlacedTemplate, { ...data });
        default:
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `Unknown template key: "${templateKey}"`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9lbWFpbC1ub3RpZmljYXRpb25zL3RlbXBsYXRlcy9pbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBWUEsc0RBMEJDOztBQXJDRCxxREFBdUQ7QUFDdkQsK0NBQThFO0FBc0NyRSxnR0F0Q0EsNkJBQWUsT0FzQ0E7QUFyQ3hCLGlEQUE2RjtBQXFDbkUsb0dBckNqQixrQ0FBbUIsT0FxQ2lCO0FBbkNoQyxRQUFBLGNBQWMsR0FBRztJQUM1QixXQUFXLEVBQVgseUJBQVc7SUFDWCxZQUFZLEVBQVosMkJBQVk7Q0FDSixDQUFBO0FBSVYsU0FBZ0IscUJBQXFCLENBQUMsV0FBbUIsRUFBRSxJQUFhO0lBQ3RFLFFBQVEsV0FBVyxFQUFFLENBQUM7UUFDcEIsS0FBSyxzQkFBYyxDQUFDLFdBQVc7WUFDN0IsSUFBSSxDQUFDLElBQUEsOEJBQWdCLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxJQUFJLG1CQUFXLENBQ25CLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsOEJBQThCLHNCQUFjLENBQUMsV0FBVyxHQUFHLENBQzVELENBQUE7WUFDSCxDQUFDO1lBQ0QsT0FBTyx1QkFBQyw2QkFBZSxPQUFLLElBQUksR0FBSSxDQUFBO1FBRXRDLEtBQUssc0JBQWMsQ0FBQyxZQUFZO1lBQzlCLElBQUksQ0FBQyxJQUFBLHdDQUF5QixFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE1BQU0sSUFBSSxtQkFBVyxDQUNuQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQzlCLDhCQUE4QixzQkFBYyxDQUFDLFlBQVksR0FBRyxDQUM3RCxDQUFBO1lBQ0gsQ0FBQztZQUNELE9BQU8sdUJBQUMsa0NBQW1CLE9BQUssSUFBSSxHQUFJLENBQUE7UUFFMUM7WUFDRSxNQUFNLElBQUksbUJBQVcsQ0FDbkIsbUJBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUM5QiwwQkFBMEIsV0FBVyxHQUFHLENBQ3pDLENBQUE7SUFDTCxDQUFDO0FBQ0gsQ0FBQyJ9