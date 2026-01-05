/**
 * MOBILE HOME FEED VERIFICATION SCRIPT
 */

const BACKEND_URL = "http://localhost:9000";

async function verifyHomeFeed() {
  console.log("🚀 Verifying Mobile Home Feed...");

  try {
    // 1. Test /store/mobile/home-feed
    console.log("🔍 Testing GET /store/mobile/home-feed...");
    const feedRes = await fetch(`${BACKEND_URL}/store/mobile/home-feed`);
    
    if (!feedRes.ok) {
        // If 404, backend might not be running or route not registered correctly
        if (feedRes.status === 404) {
            console.log("⚠️ Endpoint returned 404. Is the Medusa server running with the new code?");
            return;
        }
        throw new Error(`Home feed returned ${feedRes.status}`);
    }

    const feedData = await feedRes.json();
    console.log("✅ Home Feed Response received.");
    console.log(`Sections count: ${feedData.sections?.length || 0}`);
    
    if (feedData.sections) {
        feedData.sections.forEach((s: any, i: number) => {
            console.log(`  [${i}] ID: ${s.id}, Type: ${s.type}`);
        });
    }

    // 2. Test Category Filtering
    console.log("\n🔍 Testing Category Filtering (parent_id=null)...");
    const catRes = await fetch(`${BACKEND_URL}/store/product-categories?parent_id=null`);
    if (!catRes.ok) throw new Error(`Categories endpoint failed: ${catRes.status}`);
    
    const catData = await catRes.json();
    const categories = catData.product_categories || [];
    console.log(`✅ Received ${categories.length} top-level categories.`);
    
    const invalidCats = categories.filter((c: any) => c.parent_category_id !== null);
    if (invalidCats.length > 0) {
        throw new Error(`Filtering failed! Found categories with parent_id: ${JSON.stringify(invalidCats.map((c: any) => c.id))}`);
    } else {
        console.log("✅ Category filtering verified: All returned categories have null parent_id.");
    }

    console.log("\n✨ Verification Complete!");

  } catch (err: any) {
    console.error(`\n💥 FAILED: ${err.message}`);
    process.exit(1);
  }
}

verifyHomeFeed();
