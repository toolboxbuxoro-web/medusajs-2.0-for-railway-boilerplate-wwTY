"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = listShippingOptions;
const utils_1 = require("@medusajs/framework/utils");
async function listShippingOptions({ container }) {
    const fulfillmentModule = container.resolve(utils_1.Modules.FULFILLMENT);
    const options = await fulfillmentModule.listShippingOptions({});
    console.log(JSON.stringify(options, null, 2));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1zaGlwcGluZy1vcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvbGlzdC1zaGlwcGluZy1vcHRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0Esc0NBSUM7QUFORCxxREFBbUQ7QUFFcEMsS0FBSyxVQUFVLG1CQUFtQixDQUFDLEVBQUUsU0FBUyxFQUFFO0lBQzNELE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDaEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2pELENBQUMifQ==