"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const click_merchant_1 = require("../../../modules/payment-click/services/click-merchant");
function parseIncomingParams(req) {
    const body = req.body;
    let parsedBody = {};
    if (typeof body === "string") {
        parsedBody = Object.fromEntries(new URLSearchParams(body));
    }
    else if (body && typeof body === "object") {
        parsedBody = body;
    }
    // Click sends POST, sometimes parameters may also appear in querystring
    const query = req.query || {};
    return { ...query, ...parsedBody };
}
async function POST(req, res) {
    const clickMerchant = new click_merchant_1.ClickMerchantService({
        logger: req.scope.resolve("logger"),
        container: req.scope,
    });
    const params = parseIncomingParams(req);
    const result = await clickMerchant.handlePrepare(params);
    res.json(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2NsaWNrL3ByZXBhcmUvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFrQkEsb0JBVUM7QUEzQkQsMkZBQTZGO0FBRTdGLFNBQVMsbUJBQW1CLENBQUMsR0FBa0I7SUFDN0MsTUFBTSxJQUFJLEdBQVMsR0FBVyxDQUFDLElBQUksQ0FBQTtJQUNuQyxJQUFJLFVBQVUsR0FBd0IsRUFBRSxDQUFBO0lBRXhDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDN0IsVUFBVSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUM1RCxDQUFDO1NBQU0sSUFBSSxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDNUMsVUFBVSxHQUFHLElBQUksQ0FBQTtJQUNuQixDQUFDO0lBRUQsd0VBQXdFO0lBQ3hFLE1BQU0sS0FBSyxHQUFJLEdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFBO0lBQ3RDLE9BQU8sRUFBRSxHQUFHLEtBQUssRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFBO0FBQ3BDLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsQ0FBQztRQUM3QyxNQUFNLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ25DLFNBQVMsRUFBRSxHQUFHLENBQUMsS0FBSztLQUNyQixDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFeEQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNsQixDQUFDIn0=