"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const medusa_1 = require("@medusajs/medusa");
exports.default = (0, medusa_1.defineMiddlewares)({
    routes: [
        {
            matcher: "/health",
            method: "GET",
            middlewares: [],
            authenticate: false,
        },
        {
            matcher: "/payme",
            method: "POST",
            middlewares: [],
            authenticate: false,
        },
        {
            matcher: "/click/prepare",
            method: "POST",
            middlewares: [],
            authenticate: false,
        },
        {
            matcher: "/click/complete",
            method: "POST",
            middlewares: [],
            authenticate: false,
        },
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQW9EO0FBRXBELGtCQUFlLElBQUEsMEJBQWlCLEVBQUM7SUFDL0IsTUFBTSxFQUFFO1FBQ047WUFDRSxPQUFPLEVBQUUsU0FBUztZQUNsQixNQUFNLEVBQUUsS0FBSztZQUNiLFdBQVcsRUFBRSxFQUFFO1lBQ2YsWUFBWSxFQUFFLEtBQUs7U0FDcEI7UUFDRDtZQUNFLE9BQU8sRUFBRSxRQUFRO1lBQ2pCLE1BQU0sRUFBRSxNQUFNO1lBQ2QsV0FBVyxFQUFFLEVBQUU7WUFDZixZQUFZLEVBQUUsS0FBSztTQUNwQjtRQUNEO1lBQ0UsT0FBTyxFQUFFLGdCQUFnQjtZQUN6QixNQUFNLEVBQUUsTUFBTTtZQUNkLFdBQVcsRUFBRSxFQUFFO1lBQ2YsWUFBWSxFQUFFLEtBQUs7U0FDcEI7UUFDRDtZQUNFLE9BQU8sRUFBRSxpQkFBaUI7WUFDMUIsTUFBTSxFQUFFLE1BQU07WUFDZCxXQUFXLEVBQUUsRUFBRTtZQUNmLFlBQVksRUFBRSxLQUFLO1NBQ3BCO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==