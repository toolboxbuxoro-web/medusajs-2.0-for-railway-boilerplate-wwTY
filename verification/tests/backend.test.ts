import { parseProductMetadata } from "../../storefront/src/modules/products/types/product-metadata";

/**
 * BACKEND VERIFICATION SCRIPT (FINAL)
 */

const BACKEND_URL = "http://localhost:9000";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@toolbox.com";
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "admin123456";
const PUBLISHABLE_KEY = "pk_c0c51645f4b9a85abbc87463bb1361f07f621e78e84351ed535d6868fb1e865c";
const SALES_CHANNEL_ID = "sc_01KAX39PKG031FSWJ51G0WXC31";

async function runTest() {
  console.log("🚀 Running Final Backend Verification...");
  const timestamp = Date.now();
  const handle = `verified-p-${timestamp}`;

  try {
    const authRes = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    const { token } = await authRes.json();

    const complexMetadata = {
      brand: "BRAND_VERIFIED_" + timestamp,
      category: "CAT_VERIFIED",
      professional_level: "профессиональный",
      pickup_only: true,
      short_description: "Safe for E2E",
      features: ["Super Feature"],
      use_cases: ["E2E UseCase"],
      specifications: { "Power": "9000W" },
      seo_title: "SEO_VERIFIED_TITLE",
      seo_description: "SEO_VERIFIED_DESC",
      seo_keywords: ["verified", "e2e"]
    };

    console.log(`🛠️ Creating product: ${handle}`);
    const createRes = await fetch(`${BACKEND_URL}/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        title: "Verified Product " + timestamp,
        handle: handle,
        metadata: complexMetadata,
        status: "published",
        sales_channels: [{ id: SALES_CHANNEL_ID }],
        shipping_profile_id: "sp_01KAX39PF19GRG4Y77M7R3A1V4",
        options: [{ title: "Default", values: ["Default"] }],
        variants: [{
            title: "Default",
            options: { "Default": "Default" },
            prices: [{ currency_code: "uzs", amount: 1000 }]
        }]
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error("Create failed: " + JSON.stringify(createData));

    console.log(`✅ Product created: ${createData.product.id}`);

    // Poll Store API
    console.log("🔍 Polling Store API...");
    for (let i = 0; i < 15; i++) {
        const storeRes = await fetch(`${BACKEND_URL}/store/products?handle=${handle}&fields=+metadata`, {
          headers: { "x-publishable-api-key": PUBLISHABLE_KEY }
        });
        const { products } = await storeRes.json();
        if (products && products[0] && products[0].metadata?.brand === complexMetadata.brand) {
            console.log("✅ Store API Metadata Verified!");
            console.log(`RESULT_HANDLE=${handle}`);
            return;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error("Store API didn't show correct metadata in time.");

  } catch (err) {
    console.error(`\n💥 FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();
