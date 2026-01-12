"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    console.log("[Custom Categories API] Request received", {
        query: req.query,
        url: req.url,
    });
    const remoteQuery = req.scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    // Get query parameters
    const { handle, fields, limit = 100, offset = 0 } = req.query;
    // Build fields array - always include metadata
    const defaultFields = [
        "id",
        "name",
        "description",
        "handle",
        "is_active",
        "is_internal",
        "rank",
        "parent_category_id",
        "parent_category",
        "metadata",
        "category_children.*",
        "category_children.metadata",
    ];
    // Parse additional fields from query if provided
    let requestedFields = defaultFields;
    if (fields && typeof fields === "string") {
        const additionalFields = fields.split(",").map((f) => f.trim());
        requestedFields = [...new Set([...defaultFields, ...additionalFields])];
    }
    // Build filters
    const filters = {};
    if (handle) {
        filters.handle = Array.isArray(handle) ? handle : [handle];
    }
    // Support parent_category_id filtering (essential for mobile)
    const parentId = req.query.parent_category_id || req.query.parent_id;
    if (parentId !== undefined) {
        filters.parent_category_id = parentId === "null" ? null : parentId;
    }
    const queryObject = (0, utils_1.remoteQueryObjectFromString)({
        entryPoint: "product_category",
        variables: {
            filters,
            take: Number(limit),
            skip: Number(offset),
        },
        fields: requestedFields,
    });
    console.log("[Custom Categories API] Query object:", JSON.stringify(queryObject, null, 2));
    try {
        const { rows, metadata } = await remoteQuery(queryObject);
        console.log("[Custom Categories API] Success:", {
            count: rows?.length,
            hasMetadata: rows?.[0]?.metadata ? "yes" : "no",
            firstCategory: rows?.[0] ? {
                id: rows[0].id,
                name: rows[0].name,
                handle: rows[0].handle,
                metadata: rows[0].metadata,
            } : null,
        });
        res.json({
            product_categories: rows || [],
            count: metadata?.count || rows?.length || 0,
            offset: Number(offset),
            limit: Number(limit),
        });
    }
    catch (error) {
        console.error("[Custom Categories API] Error fetching categories:", error);
        res.status(500).json({
            error: "Failed to fetch categories",
            message: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Byb2R1Y3QtY2F0ZWdvcmllcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU1BLGtCQXFGQztBQTFGRCxxREFHa0M7QUFFM0IsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLEVBQUU7UUFDdEQsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1FBQ2hCLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztLQUNiLENBQUMsQ0FBQTtJQUVGLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLFlBQVksQ0FBQyxDQUFBO0lBRTdFLHVCQUF1QjtJQUN2QixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEdBQUcsR0FBRyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFBO0lBRTdELCtDQUErQztJQUMvQyxNQUFNLGFBQWEsR0FBRztRQUNwQixJQUFJO1FBQ0osTUFBTTtRQUNOLGFBQWE7UUFDYixRQUFRO1FBQ1IsV0FBVztRQUNYLGFBQWE7UUFDYixNQUFNO1FBQ04sb0JBQW9CO1FBQ3BCLGlCQUFpQjtRQUNqQixVQUFVO1FBQ1YscUJBQXFCO1FBQ3JCLDRCQUE0QjtLQUM3QixDQUFBO0lBRUQsaURBQWlEO0lBQ2pELElBQUksZUFBZSxHQUFHLGFBQWEsQ0FBQTtJQUNuQyxJQUFJLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUN6QyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxF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