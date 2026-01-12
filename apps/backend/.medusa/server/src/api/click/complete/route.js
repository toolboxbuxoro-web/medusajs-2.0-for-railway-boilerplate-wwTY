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
    const query = req.query || {};
    return { ...query, ...parsedBody };
}
async function POST(req, res) {
    const clickMerchant = new click_merchant_1.ClickMerchantService({
        logger: req.scope.resolve("logger"),
        container: req.scope,
    });
    const params = parseIncomingParams(req);
    const result = await clickMerchant.handleComplete(params);
    res.json(result);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2NsaWNrL2NvbXBsZXRlL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBaUJBLG9CQVVDO0FBMUJELDJGQUE2RjtBQUU3RixTQUFTLG1CQUFtQixDQUFDLEdBQWtCO0lBQzdDLE1BQU0sSUFBSSxHQUFTLEdBQVcsQ0FBQyxJQUFJLENBQUE7SUFDbkMsSUFBSSxVQUFVLEdBQXdCLEVBQUUsQ0FBQTtJQUV4QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzdCLFVBQVUsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7SUFDNUQsQ0FBQztTQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQzVDLFVBQVUsR0FBRyxJQUFJLENBQUE7SUFDbkIsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFJLEdBQVcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFBO0lBQ3RDLE9BQU8sRUFBRSxHQUFHLEtBQUssRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFBO0FBQ3BDLENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQ0FBb0IsQ0FBQztRQUM3QyxNQUFNLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDO1FBQ25DLFNBQVMsRUFBRSxHQUFHLENBQUMsS0FBSztLQUNyQixDQUFDLENBQUE7SUFFRixNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFekQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNsQixDQUFDIn0=