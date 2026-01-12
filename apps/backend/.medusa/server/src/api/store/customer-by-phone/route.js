"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const _shared_1 = require("../otp/_shared");
/**
 * Public route to resolve a phone number to an email.
 * Used by the storefront login flow to support legacy users who have real emails.
 */
async function GET(req, res) {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: "phone_required" });
    }
    try {
        const customer = await (0, _shared_1.findCustomerByPhone)(req, phone);
        if (!customer) {
            return res.json({ found: false });
        }
        return res.json({
            found: true,
            email: customer.email,
            phone: customer.phone // optional, but matches what we found
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2N1c3RvbWVyLWJ5LXBob25lL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT0Esa0JBc0JDO0FBNUJELDRDQUFvRDtBQUVwRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUEwQixDQUFBO0lBRWhELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO0lBQzFELENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsNkJBQW1CLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRXRELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLENBQUM7UUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxLQUFLLEVBQUUsSUFBSTtZQUNYLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztZQUNyQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0M7U0FDN0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUN2RCxDQUFDO0FBQ0gsQ0FBQyJ9