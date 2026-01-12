"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = userInviteHandler;
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../lib/constants");
const templates_1 = require("../modules/email-notifications/templates");
async function userInviteHandler({ event: { data }, container, }) {
    const notificationModuleService = container.resolve(utils_1.Modules.NOTIFICATION);
    const userModuleService = container.resolve(utils_1.Modules.USER);
    const invite = await userModuleService.retrieveInvite(data.id);
    try {
        await notificationModuleService.createNotifications({
            to: invite.email,
            channel: 'email',
            template: templates_1.EmailTemplates.INVITE_USER,
            data: {
                emailOptions: {
                    replyTo: 'info@example.com',
                    subject: "You've been invited to Medusa!"
                },
                inviteLink: `${constants_1.BACKEND_URL}/app/invite?token=${invite.token}`,
                preview: 'The administration dashboard awaits...'
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}
exports.config = {
    event: ['invite.created', 'invite.resent']
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRlLWNyZWF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvaW52aXRlLWNyZWF0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBTUEsb0NBNEJDO0FBakNELHFEQUFtRDtBQUVuRCxnREFBOEM7QUFDOUMsd0VBQXlFO0FBRTFELEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxFQUM1QyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFDZixTQUFTLEdBQ1c7SUFFdEIsTUFBTSx5QkFBeUIsR0FBK0IsU0FBUyxDQUFDLE9BQU8sQ0FDN0UsZUFBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQTtJQUNELE1BQU0saUJBQWlCLEdBQXVCLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzdFLE1BQU0sTUFBTSxHQUFHLE1BQU0saUJBQWlCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUU5RCxJQUFJLENBQUM7UUFDSCxNQUFNLHlCQUF5QixDQUFDLG1CQUFtQixDQUFDO1lBQ2xELEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSztZQUNoQixPQUFPLEVBQUUsT0FBTztZQUNoQixRQUFRLEVBQUUsMEJBQWMsQ0FBQyxXQUFXO1lBQ3BDLElBQUksRUFBRTtnQkFDSixZQUFZLEVBQUU7b0JBQ1osT0FBTyxFQUFFLGtCQUFrQjtvQkFDM0IsT0FBTyxFQUFFLGdDQUFnQztpQkFDMUM7Z0JBQ0QsVUFBVSxFQUFFLEdBQUcsdUJBQVcscUJBQXFCLE1BQU0sQ0FBQyxLQUFLLEVBQUU7Z0JBQzdELE9BQU8sRUFBRSx3Q0FBd0M7YUFDbEQ7U0FDRixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDdEIsQ0FBQztBQUNILENBQUM7QUFFWSxRQUFBLE1BQU0sR0FBcUI7SUFDdEMsS0FBSyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDO0NBQzNDLENBQUEifQ==