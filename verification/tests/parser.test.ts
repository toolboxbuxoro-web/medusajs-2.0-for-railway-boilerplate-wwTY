import { parseProductMetadata, EMPTY_PRODUCT_METADATA } from "../../storefront/src/modules/products/types/product-metadata";

/**
 * PARSER SAFETY TEST SUITE
 * 
 * Objectives:
 * 1. Never throw an exception.
 * 2. Always return a valid ProductMetadata object.
 * 3. Correctly apply defaults.
 * 4. Handle extreme garbage input.
 */

const tests = [
  {
    name: "A) Full Valid Metadata",
    input: {
      brand: "Bosch",
      category: "Tools",
      professional_level: "профессиональный",
      pickup_only: true,
      short_description: "Pro drill",
      features: ["Heavy Duty", "Brushless"],
      use_cases: ["Construction"],
      specifications: { "Voltage": "18V" },
      seo_title: "Bosch Pro Drill",
      seo_description: "Best for pros",
      seo_keywords: ["bosch", "drill"]
    },
    assert: (out: any) => out.brand === "Bosch" && out.features.length === 2 && out.professional_level === "профессиональный"
  },
  {
    name: "B) Empty Metadata {}",
    input: {},
    assert: (out: any) => JSON.stringify(out) === JSON.stringify(EMPTY_PRODUCT_METADATA)
  },
  {
    name: "C) Partial Metadata",
    input: { brand: "Makita" },
    assert: (out: any) => out.brand === "Makita" && out.features.length === 0 && out.pickup_only === true
  },
  {
    name: "D) Malformed Types (Numbers/Booleans in strings)",
    input: {
      brand: 123, // Should default to ""
      features: "not an array", // Should default to []
      specifications: null, // Should default to {}
      professional_level: "garbage" // Should default to "бытовой"
    },
    assert: (out: any) => out.brand === "" && out.features.length === 0 && out.professional_level === "бытовой"
  },
  {
    name: "E) Extreme Garbage (Nulls everywhere)",
    input: null,
    assert: (out: any) => JSON.stringify(out) === JSON.stringify(EMPTY_PRODUCT_METADATA)
  },
  {
    name: "F) Preservation of pickup_only",
    input: { pickup_only: false },
    assert: (out: any) => out.pickup_only === false // It parses what's there, logic is handled by defaults/enforcement
  },
  {
    name: "G) Localization and System Field Preservation",
    input: {
      title_uz: "Sarlavha",
      mxik_code: "12345"
    },
    assert: (out: any) => out.title_uz === "Sarlavha" && out.mxik_code === "12345"
  }
];

async function runTests() {
  console.log("🚀 Running Parser Safety Tests...\n");
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const output = parseProductMetadata(test.input);
      const isOk = test.assert(output);
      
      if (isOk) {
        console.log(`✅ PASSED: ${test.name}`);
        passed++;
      } else {
        console.error(`❌ FAILED: ${test.name}`);
        console.error("Input:", JSON.stringify(test.input));
        console.error("Output:", JSON.stringify(output));
        failed++;
      }
    } catch (err) {
      console.error(`💥 CRASHED: ${test.name}`);
      console.error(err);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
