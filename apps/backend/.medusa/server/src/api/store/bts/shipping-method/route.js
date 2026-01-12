"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const crypto_1 = __importDefault(require("crypto"));
const columnCache = {};
async function hasColumnCached(pg, tableName, columnName) {
    const cacheKey = `${tableName}.${columnName}`;
    if (cacheKey in columnCache)
        return columnCache[cacheKey];
    try {
        const res = await pg.raw(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `, [tableName, columnName]);
        const rows = res?.rows || res || [];
        columnCache[cacheKey] = !!rows?.length;
        return columnCache[cacheKey];
    }
    catch {
        return false;
    }
}
/**
 * BTS shipping option can be configured without a price in Medusa admin.
 * Medusa then refuses to attach it to cart: "Shipping options ... do not have a price".
 *
 * This endpoint force-attaches a shipping method row to the cart with a concrete amount
 * (taken from storefront-calculated BTS estimate), bypassing shipping option price validation.
 *
 * Uses direct SQL INSERT to bypass Medusa's validation, then triggers cart recalculation
 * via Cart Module to ensure totals are updated correctly.
 */
async function POST(req, res) {
    const logger = req.scope.resolve("logger");
    const { cart_id, shipping_option_id, amount } = (req.body || {});
    const startTime = Date.now();
    logger?.info?.(`[store/bts/shipping-method] Processing request for cart ${cart_id}, option ${shipping_option_id}, amount ${amount}`);
    if (!cart_id || !shipping_option_id || typeof amount !== "number") {
        return res.status(400).json({ error: "cart_id, shipping_option_id, amount are required" });
    }
    if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({ error: "amount must be a non-negative number" });
    }
    try {
        const pg = req.scope.resolve("__pg_connection__");
        const cartModule = req.scope.resolve(utils_1.Modules.CART);
        // Remove any existing shipping methods for this cart (single-method model).
        await pg.raw(`DELETE FROM cart_shipping_method WHERE cart_id = ?`, [cart_id]);
        const cols = {
            id: await hasColumnCached(pg, "cart_shipping_method", "id"),
            cart_id: await hasColumnCached(pg, "cart_shipping_method", "cart_id"),
            shipping_option_id: await hasColumnCached(pg, "cart_shipping_method", "shipping_option_id"),
            name: await hasColumnCached(pg, "cart_shipping_method", "name"),
            amount: await hasColumnCached(pg, "cart_shipping_method", "amount"),
            raw_amount: await hasColumnCached(pg, "cart_shipping_method", "raw_amount"),
            currency_code: await hasColumnCached(pg, "cart_shipping_method", "currency_code"),
            data: await hasColumnCached(pg, "cart_shipping_method", "data"),
            created_at: await hasColumnCached(pg, "cart_shipping_method", "created_at"),
            updated_at: await hasColumnCached(pg, "cart_shipping_method", "updated_at"),
        };
        // Determine cart currency if the column exists.
        let currencyCode = null;
        if (cols.currency_code) {
            try {
                const r = await pg.raw(`SELECT currency_code FROM cart WHERE id = ? LIMIT 1`, [cart_id]);
                const rows = r?.rows || r || [];
                currencyCode = rows?.[0]?.currency_code || null;
            }
            catch (err) {
                logger?.warn?.(`[store/bts/shipping-method] Failed to get cart currency: ${err.message}`);
                currencyCode = null;
            }
        }
        // Get shipping option name if needed
        let shippingOptionName = "BTS Delivery";
        if (cols.name && shipping_option_id) {
            try {
                const optionResult = await pg.raw(`SELECT name FROM shipping_option WHERE id = ? LIMIT 1`, [shipping_option_id]);
                const optionRows = optionResult?.rows || optionResult || [];
                if (optionRows.length > 0 && optionRows[0]?.name) {
                    shippingOptionName = optionRows[0].name;
                }
            }
            catch (err) {
                logger?.warn?.(`[store/bts/shipping-method] Failed to get shipping option name: ${err.message}`);
            }
        }
        const id = `csm_${crypto_1.default.randomUUID().replace(/-/g, "")}`;
        const now = new Date();
        const insertCols = [];
        const placeholders = [];
        const values = [];
        if (cols.id) {
            insertCols.push("id");
            placeholders.push("?");
            values.push(id);
        }
        if (cols.cart_id) {
            insertCols.push("cart_id");
            placeholders.push("?");
            values.push(cart_id);
        }
        if (cols.name) {
            insertCols.push("name");
            placeholders.push("?");
            values.push(shippingOptionName);
        }
        if (cols.shipping_option_id) {
            insertCols.push("shipping_option_id");
            placeholders.push("?");
            values.push(shipping_option_id);
        }
        if (cols.amount) {
            insertCols.push("amount");
            placeholders.push("?");
            values.push(amount);
        }
        if (cols.raw_amount) {
            insertCols.push("raw_amount");
            placeholders.push("?");
            // Medusa 2.0 BigNumber in DB expects { "value": "..." }
            values.push({
                value: amount.toString()
            });
        }
        if (cols.currency_code) {
            insertCols.push("currency_code");
            placeholders.push("?");
            values.push((currencyCode || "uzs").toLowerCase());
        }
        if (cols.data) {
            insertCols.push("data");
            placeholders.push("?");
            values.push(JSON.stringify({ source: "bts_estimate" }));
        }
        if (cols.created_at) {
            insertCols.push("created_at");
            placeholders.push("?");
            values.push(now);
        }
        if (cols.updated_at) {
            insertCols.push("updated_at");
            placeholders.push("?");
            values.push(now);
        }
        if (!insertCols.length) {
            return res.status(500).json({ error: "cart_shipping_method schema not detected" });
        }
        // Insert shipping method directly (bypassing Medusa validation)
        await pg.raw(`INSERT INTO cart_shipping_method (${insertCols.join(", ")}) VALUES (${placeholders.join(", ")})`, values);
        // Trigger cart recalculation via Cart Module to update totals
        try {
            await cartModule.updateCarts(cart_id, {});
            logger?.info?.(`[store/bts/shipping-method] Cart ${cart_id} recalculated successfully in ${Date.now() - startTime}ms`);
        }
        catch (recalcError) {
            logger?.warn?.(`[store/bts/shipping-method] Cart recalculation warning for ${cart_id}: ${recalcError?.message || recalcError}`);
        }
        return res.json({ success: true, duration: Date.now() - startTime });
    }
    catch (e) {
        logger?.error?.(`[store/bts/shipping-method] Fatal error for cart ${cart_id} after ${Date.now() - startTime}ms: ${e?.message || e}`);
        return res.status(500).json({ error: e?.message || "internal_error" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2J0cy9zaGlwcGluZy1tZXRob2Qvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUE4Q0Esb0JBa0pDO0FBL0xELHFEQUFtRDtBQUNuRCxvREFBMkI7QUFRM0IsTUFBTSxXQUFXLEdBQTRCLEVBQUUsQ0FBQTtBQUUvQyxLQUFLLFVBQVUsZUFBZSxDQUFDLEVBQU8sRUFBRSxTQUFpQixFQUFFLFVBQWtCO0lBQzNFLE1BQU0sUUFBUSxHQUFHLEdBQUcsU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFBO0lBQzdDLElBQUksUUFBUSxJQUFJLFdBQVc7UUFBRSxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUV6RCxJQUFJLENBQUM7UUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQ3RCOzs7Ozs7O0tBT0QsRUFDQyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FDeEIsQ0FBQTtRQUNELE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxJQUFJLEVBQUUsQ0FBQTtRQUNuQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUE7UUFDdEMsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDOUIsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDMUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUs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