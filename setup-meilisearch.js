// Native fetch is available in Node 18+

// CONFIGURATION
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY || "masterKey";
const INDEX_NAME = "products";

async function updateSettings() {
    console.log(`🔧 Configuring Meilisearch index: ${INDEX_NAME}`);
    console.log(`   Host: ${MEILISEARCH_HOST}`);

    const settings = {
        // Attributes we can search text in
        searchableAttributes: [
            "title",
            "description",
            "variant_sku",
            "handle",
            "brand",
            "title_uz",
            "seo_keywords",
            "metadata.seo_keywords",
            "metadata.features",
            "metadata.specifications",
            "metadata.title_uz",
            "collection_title"
        ],
        // Attributes we can use for filtering (e.g. filter by category="tools")
        filterableAttributes: [
            "id",
            "handle",
            "brand",
            "collection",
            "collection_id",
            "type",
            "tags",
            "categories",
            "categories.id",
            "categories.handle",
            "variants",
            "variants.id",
            "variants.sku",
            "price",
            "in_stock"
        ],
        // Attributes we can sort by
        sortableAttributes: [
            "title",
            "created_at",
            "updated_at",
            "price",
            "sales_count",
            "rating_avg"
        ],
        // Rules for ranking
        rankingRules: [
            "words",
            "typo",
            "proximity",
            "attribute",
            "sort",
            "exactness",
            "in_stock:desc", // Custom ranking rule: in_stock items first
            "sales_count:desc" // Then popular items
        ]
    };

    try {
        const res = await fetch(`${MEILISEARCH_HOST}/indexes/${INDEX_NAME}/settings`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MEILISEARCH_ADMIN_KEY}`
            },
            body: JSON.stringify(settings)
        });

        if (!res.ok) {
            console.error("❌ Failed to update settings:", await res.text());
            return;
        }

        const task = await res.json();
        console.log("✅ Settings update task submitted:", task);

        // Check task status
        console.log("   Waiting for task completion...");
        await new Promise(r => setTimeout(r, 2000));

        const taskRes = await fetch(`${MEILISEARCH_HOST}/tasks/${task.taskUid}`, {
            headers: { "Authorization": `Bearer ${MEILISEARCH_ADMIN_KEY}` }
        });
        const taskStatus = await taskRes.json();

        if (taskStatus.status === 'succeeded') {
            console.log("✨ Configuration complete!");
        } else {
            console.log(`   Task status: ${taskStatus.status}`);
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

// Support newer Node fetch if needed, but using node-fetch for compatibility
// Or use global fetch if node version > 18
if (typeof fetch === "undefined") {
    // Just in case
    console.error("Please run with Node 18+");
} else {
    updateSettings();
}
