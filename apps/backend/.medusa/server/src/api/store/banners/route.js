"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    const remoteQuery = req.scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    const queryObject = (0, utils_1.remoteQueryObjectFromString)({
        entryPoint: "store",
        variables: {
            filters: {},
            take: 1,
            skip: 0,
        },
        fields: ["id", "metadata"],
    });
    const { rows } = await remoteQuery(queryObject);
    const store = rows?.[0];
    const metadata = store?.metadata;
    const parsedMeta = typeof metadata === "string"
        ? (() => {
            try {
                return JSON.parse(metadata);
            }
            catch {
                return {};
            }
        })()
        : metadata || {};
    const bannersRaw = parsedMeta?.banners;
    const banners = Array.isArray(bannersRaw) ? bannersRaw : [];
    banners.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    res.json({
        banners,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2Jhbm5lcnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFzQkEsa0JBb0NDO0FBekRELHFEQUdrQztBQWtCM0IsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLFlBQVksQ0FBQyxDQUFBO0lBRTdFLE1BQU0sV0FBVyxHQUFHLElBQUEsbUNBQTJCLEVBQUM7UUFDOUMsVUFBVSxFQUFFLE9BQU87UUFDbkIsU0FBUyxFQUFFO1lBQ1QsT0FBTyxFQUFFLEVBQUU7WUFDWCxJQUFJLEVBQUUsQ0FBQztZQUNQLElBQUksRUFBRSxDQUFDO1NBQ1I7UUFDRCxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO0tBQzNCLENBQUMsQ0FBQTtJQUVGLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtJQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV2QixNQUFNLFFBQVEsR0FBRyxLQUFLLEVBQUUsUUFBUSxDQUFBO0lBQ2hDLE1BQU0sVUFBVSxHQUNkLE9BQU8sUUFBUSxLQUFLLFFBQVE7UUFDMUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO1lBQ0osSUFBSSxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUM3QixDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNQLE9BQU8sRUFBRSxDQUFBO1lBQ1gsQ0FBQztRQUNILENBQUMsQ0FBQyxFQUFFO1FBQ04sQ0FBQyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUE7SUFFcEIsTUFBTSxVQUFVLEdBQUksVUFBa0IsRUFBRSxPQUFPLENBQUE7SUFDL0MsTUFBTSxPQUFPLEdBQWEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFFckUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUV2RSxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsT0FBTztLQUNSLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==