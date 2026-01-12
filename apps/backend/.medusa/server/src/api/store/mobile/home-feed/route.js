"use strict";
/**
 * ⚠️ Mobile-only endpoint
 * This route MUST NOT be used by the web storefront.
 * Any breaking change here is acceptable ONLY for mobile.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    const remoteQuery = req.scope.resolve(utils_1.ContainerRegistrationKeys.REMOTE_QUERY);
    // 0. Resolve Active Experiment (Backend-Driven)
    // This helps serve different UX variants to different users without client logic.
    // We prioritize the x-experiment header, which could be set by a gateway or hash logic.
    const rawHeader = req.headers["x-experiment"];
    const activeExperiment = rawHeader ? rawHeader.trim().toLowerCase() : "control";
    try {
        // 1. Fetch Store Metadata (Banners)
        const storeQuery = (0, utils_1.remoteQueryObjectFromString)({
            entryPoint: "store",
            variables: { take: 1 },
            fields: ["id", "metadata"],
        });
        const { rows: storeRows } = await remoteQuery(storeQuery);
        const store = storeRows?.[0];
        // Defensive parsing for banners
        const metadata = store?.metadata;
        const parsedMeta = typeof metadata === "string"
            ? (() => { try {
                return JSON.parse(metadata);
            }
            catch {
                return {};
            } })()
            : metadata || {};
        const rawBanners = Array.isArray(parsedMeta?.banners) ? parsedMeta.banners : [];
        const mobileBanners = rawBanners.filter((b) => {
            const device = b?.metadata?.device || b?.device; // Check both if device is direct prop or in meta
            return device === "mobile" || device === "all" || !device;
        });
        // 2. Fetch Top-Level Categories
        const categoryQuery = (0, utils_1.remoteQueryObjectFromString)({
            entryPoint: "product_category",
            variables: {
                filters: { parent_category_id: null },
                take: 20
            },
            fields: ["id", "name", "handle", "metadata"],
        });
        const { rows: categoriesRows } = await remoteQuery(categoryQuery);
        const categories = Array.isArray(categoriesRows) ? categoriesRows : [];
        // 3. Fetch Collections
        const collectionQuery = (0, utils_1.remoteQueryObjectFromString)({
            entryPoint: "product_collection",
            variables: { take: 100 },
            fields: ["id", "title", "handle", "metadata"],
        });
        const { rows: collectionsRows } = await remoteQuery(collectionQuery);
        const collections = Array.isArray(collectionsRows) ? collectionsRows : [];
        // 4. Construct Sections with CMS Control
        // This endpoint is MOBILE-ONLY. DO NOT reuse for web storefront.
        const candidateSections = [];
        // -- Section: Banner Slider --
        // Global visibility and order can be controlled via store.metadata.mobile_sections.hero
        const heroMeta = parsedMeta?.mobile_sections?.hero || {};
        const isHeroEnabled = heroMeta.mobile_enabled !== false;
        // Experiment check
        const heroExp = heroMeta.mobile_experiment;
        const matchesHeroExp = !heroExp || heroExp === activeExperiment;
        if (isHeroEnabled && matchesHeroExp && mobileBanners.length > 0) {
            candidateSections.push({
                id: "hero",
                type: "banner_slider",
                mobile_order: Number(heroMeta.mobile_order) || 0,
                _experiment: heroExp ? { name: heroExp, variant: activeExperiment } : null,
                data: mobileBanners.map((b) => ({
                    id: b.id,
                    image: b.image_url,
                    action: b.href,
                    title: { ru: b.title, uz: b.title_uz || b.title }
                }))
            });
        }
        // -- Section: Category Chips --
        // Global visibility and order can be controlled via store.metadata.mobile_sections.categories
        const categoryMeta = parsedMeta?.mobile_sections?.categories || {};
        const isCategoryEnabled = categoryMeta.mobile_enabled !== false;
        // Experiment check
        const catExp = categoryMeta.mobile_experiment;
        const matchesCatExp = !catExp || catExp === activeExperiment;
        if (isCategoryEnabled && matchesCatExp && categories.length > 0) {
            candidateSections.push({
                id: "categories",
                type: "category_chips",
                mobile_order: Number(categoryMeta.mobile_order) || 0,
                _experiment: catExp ? { name: catExp, variant: activeExperiment } : null,
                data_source: "/store/product-categories?parent_id=null"
            });
        }
        // -- Section: Product Rails (Collections) --
        // Visibility: metadata.mobile_home must be true (backward-compat) AND mobile_enabled must not be false
        // Experiment: metadata.mobile_experiment must match activeExperiment if present
        // Order: metadata.mobile_order
        collections.forEach((c) => {
            const isMobileHome = c.metadata?.mobile_home === true;
            const isEnabled = c.metadata?.mobile_enabled !== false;
            const colExp = c.metadata?.mobile_experiment;
            const matchesColExp = !colExp || colExp === activeExperiment;
            if (isMobileHome && isEnabled && matchesColExp) {
                candidateSections.push({
                    id: `collection_${c.handle || c.id}`,
                    type: "product_rail",
                    collection_id: c.id,
                    mobile_order: Number(c.metadata?.mobile_order) || 0,
                    _experiment: colExp ? { name: colExp, variant: activeExperiment } : null,
                    title: {
                        ru: c.metadata?.title_ru || c.title,
                        uz: c.metadata?.title_uz || c.title
                    }
                });
            }
        });
        // 5. Stable Sort by mobile_order
        // Treat missing mobile_order as 0. Maintain original order for same-order sections.
        const sections = candidateSections
            .map((s, idx) => ({ ...s, originalIndex: idx }))
            .sort((a, b) => {
            if (a.mobile_order !== b.mobile_order) {
                return a.mobile_order - b.mobile_order;
            }
            return a.originalIndex - b.originalIndex;
        })
            .map(({ mobile_order, originalIndex, ...section }) => section);
        res.json({ sections });
    }
    catch (error) {
        console.error("[Mobile Home Feed API] Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: error.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL21vYmlsZS9ob21lLWZlZWQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7O0FBUUgsa0JBaUpDO0FBdEpELHFEQUdrQztBQUUzQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsWUFBWSxDQUFDLENBQUE7SUFFN0UsZ0RBQWdEO0lBQ2hELGtGQUFrRjtJQUNsRix3RkFBd0Y7SUFDeEYsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQVcsQ0FBQTtJQUN2RCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7SUFFL0UsSUFBSSxDQUFDO1FBQ0gsb0NBQW9DO1FBQ3BDLE1BQU0sVUFBVSxHQUFHLElBQUEsbUNBQTJCLEVBQUM7WUFDN0MsVUFBVSxFQUFFLE9BQU87WUFDbkIsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtZQUN0QixNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDO1NBQzNCLENBQUMsQ0FBQTtRQUNGLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDekQsTUFBTSxLQUFLLEdBQUcsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFNUIsZ0NBQWdDO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLEtBQUssRUFBRSxRQUFRLENBQUE7UUFDaEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxRQUFRLEtBQUss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