"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        const apiKeyModuleService = req.scope.resolve(utils_1.Modules.API_KEY);
        const apiKeys = await apiKeyModuleService.listApiKeys();
        const defaultApiKey = apiKeys.find((apiKey) => apiKey.title === 'Webshop');
        if (!defaultApiKey) {
            res.json({});
        }
        else {
            res.json({ publishableApiKey: defaultApiKey.token });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2tleS1leGNoYW5nZS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxxREFBb0Q7QUFFN0MsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILE1BQU0sbUJBQW1CLEdBQXlCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRixNQUFNLE9BQU8sR0FBRyxNQUFNLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3hELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDM0UsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ25CLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDZixDQUFDO2FBQU0sQ0FBQztZQUNOLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNqRCxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBYlksUUFBQSxHQUFHLE9BYWYifQ==