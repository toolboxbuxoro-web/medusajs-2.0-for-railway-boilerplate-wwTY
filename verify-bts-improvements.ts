import { BtsApiService } from './backend/src/lib/bts-api.js';

// Mock Logger
const logger = {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    warn: (msg: string) => console.log(`[WARN] ${msg}`),
    error: (msg: string) => console.log(`[ERROR] ${msg}`),
    debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
};

async function testValidation() {
    console.log("--- Testing Validation ---");
    const btsApi = new BtsApiService(logger as any);

    const invalidParams = [
        { weight: -1, senderCityId: 40, receiverCityId: 101, senderDelivery: 0, receiverDelivery: 0 },
        { weight: 5, senderCityId: 0, receiverCityId: 101, senderDelivery: 0, receiverDelivery: 0 },
        { weight: 5, senderCityId: 40, receiverCityId: -1, senderDelivery: 0, receiverDelivery: 0 },
        { weight: 5, senderCityId: 40, receiverCityId: 101, senderDelivery: 3 as any, receiverDelivery: 0 },
    ];

    for (const params of invalidParams) {
        try {
            await btsApi.calculate(params as any);
            console.log(`❌ Failed: Params ${JSON.stringify(params)} should have failed validation`);
        } catch (e: any) {
            console.log(`✅ Success: Caught expected error: ${e.message}`);
        }
    }
}

async function testTokenRefreshRace() {
    console.log("\n--- Testing Token Refresh Race Condition ---");
    // Set fake credentials
    process.env.BTS_LOGIN = "test";
    process.env.BTS_PASSWORD = "test";
    process.env.BTS_INN = "test";

    const btsApi = new BtsApiService(logger as any);

    // Override fetchWithRetry to simulate auth delay
    // @ts-ignore
    btsApi.fetchWithRetry = async () => {
        console.log("[MOCK] fetchWithRetry called for token");
        await new Promise(r => setTimeout(r, 100));
        return {
            ok: true,
            json: async () => ({ data: { token: "fake-token-" + Date.now() } }),
            status: 200,
        } as any;
    };

    console.log("Starting 5 concurrent token requests...");
    const results = await Promise.all([
        // @ts-ignore - accessing private for testing
        btsApi.getToken(),
        // @ts-ignore
        btsApi.getToken(),
        // @ts-ignore
        btsApi.getToken(),
        // @ts-ignore
        btsApi.getToken(),
        // @ts-ignore
        btsApi.getToken(),
    ]);

    console.log("Tokens received:", results.map(t => (t as string).substring(0, 20) + "..."));

    const uniqueTokens = new Set(results);
    if (uniqueTokens.size === 1) {
        console.log("✅ Success: All concurrent requests received the same token promise result.");
    } else {
        console.log(`❌ Failed: Found ${uniqueTokens.size} different tokens!`);
    }
}

async function run() {
    try {
        await testValidation();
        await testTokenRefreshRace();
    } catch (e) {
        console.error("Test failed:", e);
    }
}

run();
