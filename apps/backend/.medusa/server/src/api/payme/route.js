"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const payme_merchant_1 = require("../../modules/payment-payme/services/payme-merchant");
async function POST(req, res) {
    const paymeMerchantService = new payme_merchant_1.PaymeMerchantService({
        logger: req.scope.resolve("logger"),
        container: req.scope
    });
    try {
        // 1. Basic Auth Validation
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new payme_merchant_1.PaymeError(-32504, "Insufficient privilege");
        }
        const [type, credentials] = authHeader.split(" ");
        if (type !== "Basic" || !credentials) {
            throw new payme_merchant_1.PaymeError(-32504, "Insufficient privilege");
        }
        const [, password] = Buffer.from(credentials, "base64").toString().split(":");
        // Проверка ключа Payme
        if (password?.trim() !== process.env.PAYME_KEY?.trim()) {
            throw new payme_merchant_1.PaymeError(-32504, "Insufficient privilege");
        }
        // Обработка JSON-RPC запроса
        const { method, params, id } = req.body;
        const result = await paymeMerchantService.handleRequest(method, params);
        res.json({
            result,
            id,
            error: null
        });
    }
    catch (error) {
        const id = req.body?.id || null;
        if (error instanceof payme_merchant_1.PaymeError) {
            res.json({
                error: {
                    code: error.code,
                    message: error.message,
                    data: error.data
                },
                result: null,
                id
            });
        }
        else {
            res.json({
                error: {
                    code: -32400,
                    message: "System error: " + error.message,
                    data: error.message
                },
                result: null,
                id
            });
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3BheW1lL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0Esb0JBK0RDO0FBakVELHdGQUFzRztBQUUvRixLQUFLLFVBQVUsSUFBSSxDQUN4QixHQUFrQixFQUNsQixHQUFtQjtJQUVuQixNQUFNLG9CQUFvQixHQUFHLElBQUkscUNBQW9CLENBQUM7UUFDcEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUNuQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEtBQUs7S0FDckIsQ0FBQyxDQUFBO0lBRUYsSUFBSSxDQUFDO1FBQ0gsMkJBQTJCO1FBQzNCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFBO1FBQzVDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksMkJBQVUsQ0FBQyxDQUFDLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxDQUFBO1FBQ3hELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDakQsSUFBSSxJQUFJLEtBQUssT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckMsTUFBTSxJQUFJLDJCQUFVLENBQUMsQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLENBQUMsQ0FBQTtRQUN4RCxDQUFDO1FBRUQsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRTdFLHVCQUF1QjtRQUN2QixJQUFJLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ3ZELE1BQU0sSUFBSSwyQkFBVSxDQUFDLENBQUMsS0FBSyxFQUFFLHdCQUF3QixDQUFDLENBQUE7UUFDeEQsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sb0JBQW9CLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV2RSxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsTUFBTTtZQUNOLEVBQUU7WUFDRixLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsTUFBTSxFQUFFLEdBQUksR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLElBQUksSUFBSSxDQUFBO1FBRXhDLElBQUksS0FBSyxZQUFZLDJCQUFVLEVBQUUsQ0FBQztZQUNoQyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNQLEtBQUssRUFBRTtvQkFDTCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7b0JBQ2hCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztvQkFDdEIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2lCQUNqQjtnQkFDRCxNQUFNLEVBQUUsSUFBSTtnQkFDWixFQUFFO2FBQ0gsQ0FBQyxDQUFBO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNQLEtBQUssRUFBRTtvQkFDTCxJQUFJLEVBQUUsQ0FBQyxLQUFLO29CQUNaLE9BQU8sRUFBRSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsT0FBTztvQkFDekMsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO2lCQUNwQjtnQkFDRCxNQUFNLEVBQUUsSUFBSTtnQkFDWixFQUFFO2FBQ0gsQ0FBQyxDQUFBO1FBQ0osQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDIn0=