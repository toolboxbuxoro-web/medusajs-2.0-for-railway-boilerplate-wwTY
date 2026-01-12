"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCustomerByPhone = findCustomerByPhone;
const phone_1 = require("../../../lib/phone");
async function findCustomerByPhone(req, phone) {
    const logger = req.scope.resolve("logger");
    const normalized = (0, phone_1.normalizeUzPhone)(phone);
    if (!normalized)
        return null;
    const pg = req.scope.resolve("__pg_connection__");
    // Normalize stored phone by removing non-digits, match against normalized digits.
    const result = await pg.raw(`
      SELECT id, email, phone
      FROM customer
      WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = ?
      LIMIT 1
    `, [normalized]);
    const rows = result?.rows || result || [];
    const customer = rows[0] || null;
    if (!customer) {
        logger.warn(`[OTP] customer not found for phone=${normalized}`);
    }
    return customer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3NoYXJlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvc3RvcmUvb3RwL19zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxrREEwQkM7QUE1QkQsOENBQXFEO0FBRTlDLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxHQUFrQixFQUFFLEtBQWE7SUFDekUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDMUMsTUFBTSxVQUFVLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxLQUFLLENBQUMsQ0FBQTtJQUMxQyxJQUFJLENBQUMsVUFBVTtRQUFFLE9BQU8sSUFBSSxDQUFBO0lBRTVCLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFRLENBQUE7SUFFeEQsa0ZBQWtGO0lBQ2xGLE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FDekI7Ozs7O0tBS0MsRUFDRCxDQUFDLFVBQVUsQ0FBQyxDQUNiLENBQUE7SUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUE7SUFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQTtJQUVoQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxVQUFVLEVBQUUsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7SUFFRCxPQUFPLFFBQVEsQ0FBQTtBQUNqQixDQUFDIn0=