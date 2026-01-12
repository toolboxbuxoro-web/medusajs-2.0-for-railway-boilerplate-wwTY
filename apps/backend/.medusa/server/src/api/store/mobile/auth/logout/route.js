"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
async function POST(req, res) {
    // Mobile app uses JWT, so logout is primarily deleting the token mobile-side.
    // We return success to acknowledge the request.
    return res.json({ success: true, message: "Logged out successfully" });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21vYmlsZS9hdXRoL2xvZ291dC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG9CQUtDO0FBTE0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLDhFQUE4RTtJQUM5RSxnREFBZ0Q7SUFFaEQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFBO0FBQ3hFLENBQUMifQ==