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
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
const constants_1 = require("../../../../../lib/constants");
const jwt = __importStar(require("jsonwebtoken"));
async function GET(req, res) {
    const logger = req.scope.resolve("logger");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, constants_1.JWT_SECRET);
        const customerId = payload.actor_id;
        if (!customerId) {
            return res.status(401).json({ error: "invalid_token" });
        }
        const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
        const [customer] = await customerModule.listCustomers({ id: customerId });
        if (!customer) {
            return res.status(404).json({ error: "customer_not_found" });
        }
        return res.json({
            customer: {
                id: customer.id,
                email: customer.email,
                phone: customer.phone,
                first_name: customer.first_name,
                last_name: customer.last_name,
            }
        });
    }
    catch (err) {
        logger.warn(`[Mobile Auth] Me verification failed: ${err.message}`);
        return res.status(401).json({ error: "unauthorized" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21vYmlsZS9hdXRoL21lL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0Esa0JBc0NDO0FBMUNELHFEQUFtRDtBQUNuRCw0REFBeUQ7QUFDekQsa0RBQW1DO0FBRTVCLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUMxQyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQTtJQUU1QyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQ3JELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRUQsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV0QyxJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxzQkFBVSxDQUFRLENBQUE7UUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQTtRQUVuQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDZCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7UUFDM0QsQ0FBQztRQUVELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxRQUFRLENBQVEsQ0FBQTtRQUNqRSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFFekUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUE7UUFDOUQsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztZQUNkLFFBQVEsRUFBRTtnQkFDUixFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ2YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVTtnQkFDL0IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTO2FBQzlCO1NBQ0YsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyx5Q0FBeUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDbkUsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO0lBQ3hELENBQUM7QUFDSCxDQUFDIn0=