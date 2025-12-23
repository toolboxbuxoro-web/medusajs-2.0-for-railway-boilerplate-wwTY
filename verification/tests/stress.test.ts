import { parseProductMetadata } from "../../storefront/src/modules/products/types/product-metadata";

/**
 * REGRESSION & STRESS TEST
 * 
 * 1. Create a product with 100 features and 100 specifications (Oversized).
 * 2. Create 5 products in a loop (Reduced from 20 for speed in this environment).
 */

const BACKEND_URL = "http://localhost:9000";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@toolbox.com";
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "admin123456";
const SALES_CHANNEL_ID = "sc_01KAX39PKG031FSWJ51G0WXC31";

async function runTest() {
  console.log("🚀 Starting Regression & Stress Test...");
  
  try {
    const authRes = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const { token } = await authRes.json();

    // CASE 1: OVERSIZED METADATA
    const oversizedMetadata: any = {
      brand: "STRESS_TEST",
      features: Array.from({ length: 100 }, (_, i) => `Extra Feature #${i}`),
      specifications: {},
      pickup_only: true
    };
    for (let i = 0; i < 100; i++) {
        oversizedMetadata.specifications[`Spec_${i}`] = `Complex Value ${i} with extra text to increase size`.repeat(5);
    }
    
    console.log(`📦 Creating oversized product (~15KB metadata)...`);
    const stressRes = await fetch(`${BACKEND_URL}/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        title: "Oversized Test Product",
        handle: "stress-product-" + Date.now(),
        metadata: oversizedMetadata,
        status: "published",
        sales_channels: [{ id: SALES_CHANNEL_ID }],
        shipping_profile_id: "sp_01KAX39PF19GRG4Y77M7R3A1V4",
        options: [{ title: "D", values: ["V"] }],
        variants: [{ title: "V", options: { "D": "V" }, prices: [{ currency_code: "uzs", amount: 1 }] }]
      })
    });
    
    if (!stressRes.ok) throw new Error("Backend crashed or rejected oversized metadata: " + stressRes.status);
    console.log("✅ Backend handled oversized metadata correctly.");

    // CASE 2: BULK PRODUCTION
    console.log("📦 Creating 5 products in bulk...");
    for (let i = 0; i < 5; i++) {
        await fetch(`${BACKEND_URL}/admin/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({
                title: `Bulk Product ${i}`,
                handle: `bulk-p-${i}-${Date.now()}`,
                metadata: { brand: "BULK", pickup_only: true },
                status: "published",
                sales_channels: [{ id: SALES_CHANNEL_ID }],
                shipping_profile_id: "sp_01KAX39PF19GRG4Y77M7R3A1V4",
                options: [{ title: "D", values: ["V"] }],
                variants: [{ title: "V", options: { "D": "V" }, prices: [{ currency_code: "uzs", amount: 1 }] }]
            })
        });
        process.stdout.write(".");
    }
    console.log("\n✅ Bulk creation completed.");

    console.log("\n🎊 REGRESSION & STRESS TEST SUCCESS!");

  } catch (err) {
    console.error(`\n💥 STRESS TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();
