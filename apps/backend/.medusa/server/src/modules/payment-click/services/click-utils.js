"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.md5Hex = md5Hex;
exports.normalizeString = normalizeString;
exports.verifyClickPrepareSignature = verifyClickPrepareSignature;
exports.verifyClickCompleteSignature = verifyClickCompleteSignature;
exports.parseUzsAmountToTiyin = parseUzsAmountToTiyin;
exports.formatTiyinToUzsAmount = formatTiyinToUzsAmount;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Click signature formulas (docs.click.uz /click-api-request):
 * - Prepare: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
 * - Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 */
function md5Hex(input) {
    return crypto_1.default.createHash("md5").update(input).digest("hex");
}
function normalizeString(value) {
    if (value === null || value === undefined)
        return "";
    return String(value).trim();
}
function verifyClickPrepareSignature(params) {
    const computed = md5Hex(params.click_trans_id +
        params.service_id +
        params.secret_key +
        params.merchant_trans_id +
        params.amount +
        params.action +
        params.sign_time);
    return computed.toLowerCase() === params.sign_string.toLowerCase();
}
function verifyClickCompleteSignature(params) {
    const computed = md5Hex(params.click_trans_id +
        params.service_id +
        params.secret_key +
        params.merchant_trans_id +
        params.merchant_prepare_id +
        params.amount +
        params.action +
        params.sign_time);
    return computed.toLowerCase() === params.sign_string.toLowerCase();
}
/**
 * Convert Click amount string in sums (format N or N.NN) into minor units (tiyin) as bigint.
 * This is used only for internal validation; signature verification must use the original string.
 */
function parseUzsAmountToTiyin(amount) {
    const norm = normalizeString(amount).replace(",", ".");
    if (!norm)
        return null;
    if (!/^\d+(\.\d+)?$/.test(norm))
        return null;
    const [i, f = ""] = norm.split(".");
    const frac2 = (f + "00").slice(0, 2);
    try {
        return BigInt(i) * 100n + BigInt(frac2);
    }
    catch {
        return null;
    }
}
function formatTiyinToUzsAmount(amountTiyin) {
    // Medusa amounts are in minor units; Click expects sums with 2 decimals.
    const v = Math.round(Number(amountTiyin));
    const sums = v / 100;
    return sums.toFixed(2);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpY2stdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wYXltZW50LWNsaWNrL3NlcnZpY2VzL2NsaWNrLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBT0Esd0JBRUM7QUFFRCwwQ0FHQztBQUVELGtFQW9CQztBQUVELG9FQXNCQztBQU1ELHNEQWFDO0FBRUQsd0RBS0M7QUF0RkQsb0RBQTJCO0FBRTNCOzs7O0dBSUc7QUFDSCxTQUFnQixNQUFNLENBQUMsS0FBYTtJQUNsQyxPQUFPLGdCQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDN0QsQ0FBQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxLQUFjO0lBQzVDLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUztRQUFFLE9BQU8sRUFBRSxDQUFBO0lBQ3BELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0FBQzdCLENBQUM7QUFFRCxTQUFnQiwyQkFBMkIsQ0FBQyxNQVMzQztJQUNDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FDckIsTUFBTSxDQUFDLGNBQWM7UUFDbkIsTUFBTSxDQUFDLFVBQVU7UUFDakIsTUFBTSxDQUFDLFVBQVU7UUFDakIsTUFBTSxDQUFDLGlCQUFpQjtRQUN4QixNQUFNLENBQUMsTUFBTTtRQUNiLE1BQU0sQ0FBQyxNQUFNO1FBQ2IsTUFBTSxDQUFDLFNBQVMsQ0FDbkIsQ0FBQTtJQUNELE9BQU8sUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDcEUsQ0FBQztBQUVELFNBQWdCLDRCQUE0QixDQUFDLE1BVTVDO0lBQ0MsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUNyQixNQUFNLENBQUMsY0FBYztRQUNuQixNQUFNLENBQUMsVUFBVTtRQUNqQixNQUFNLENBQUMsVUFBVTtRQUNqQixNQUFNLENBQUMsaUJBQWlCO1FBQ3hCLE1BQU0sQ0FBQyxtQkFBbUI7UUFDMUIsTUFBTSxDQUFDLE1BQU07UUFDYixNQUFNLENBQUMsTUFBTTtRQUNiLE1BQU0sQ0FBQyxTQUFTLENBQ25CLENBQUE7SUFDRCxPQUFPLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ3BFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxNQUFjO0lBQ2xELE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3RELElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUE7SUFDdEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQUUsT0FBTyxJQUFJLENBQUE7SUFFNUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNuQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBRXBDLElBQUksQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDekMsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFnQixzQkFBc0IsQ0FBQyxXQUFtQjtJQUN4RCx5RUFBeUU7SUFDekUsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQTtJQUN6QyxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBO0lBQ3BCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN4QixDQUFDIn0=