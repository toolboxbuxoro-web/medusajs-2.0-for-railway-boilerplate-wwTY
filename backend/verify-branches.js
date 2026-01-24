require('dotenv').config();
const { BtsApiService } = require('./src/lib/bts-api');

// Mock logger
const logger = {
    info: (msg) => console.log('INFO:', msg),
    warn: (msg) => console.log('WARN:', msg),
    error: (msg) => console.error('ERROR:', msg),
    debug: (msg) => console.log('DEBUG:', msg),
};

async function testBranches() {
    console.log("----------------------------------------------------------------");
    console.log("Testing BTS API Branches (V1 Structure)");
    console.log("----------------------------------------------------------------");

    const btsService = new BtsApiService(logger);

    try {
        console.log("Fetching branches...");
        const branches = await btsService.getBranches();

        console.log("\n✅ Branches fetched successfully!");
        console.log(`Total regions found: ${branches.length}\n`);

        branches.forEach(region => {
            console.log(`[${region.id}] ${region.name} (${region.nameRu})`);
            console.log(`   Zone: ${region.zone}`);
            console.log(`   Points: ${region.points.length}`);
            if (region.points.length > 0) {
                console.log(`   Example point: ${region.points[0].name} (CityID: ${region.points[0].city_id})`);
            }
            console.log("-");
        });

        // Verify cache key usage (conceptual, can't check redis directly here easily without mocking)
        console.log("\nNOTE: Ensure Redis key 'bts:branches:grouped:v1' is populated.");

    } catch (error) {
        console.error("\n❌ Error fetching branches:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
        }
    } finally {
        process.exit(0);
    }
}

testBranches();
