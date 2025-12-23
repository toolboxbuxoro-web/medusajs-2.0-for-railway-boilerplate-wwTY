import { chromium } from "playwright";

/**
 * STOREFRONT & SEO VERIFICATION (DEEP DIVE)
 */

const STOREFRONT_URL = "http://localhost:8000/ru/uz";
const TARGET_HANDLE = "verified-p-1766471245678";

async function runTest() {
  console.log(`🚀 Deep Dive Verification: ${TARGET_HANDLE}`);
  const pdpUrl = `${STOREFRONT_URL}/products/${TARGET_HANDLE}`;

  try {
    const htmlResponse = await fetch(pdpUrl);
    const html = await htmlResponse.text();
    
    // Find title tag
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    const metaDescMatch = html.match(/<meta name="description" content="([\s\S]*?)"/);
    const metaKeywordsMatch = html.match(/<meta name="keywords" content="([\s\S]*?)"/);

    console.log("--- SEO TAGS FOUND ---");
    console.log(`Title Tag: ${titleMatch ? titleMatch[1] : "NOT FOUND"}`);
    console.log(`Meta Desc: ${metaDescMatch ? metaDescMatch[1] : "NOT FOUND"}`);
    console.log(`Meta Keywords: ${metaKeywordsMatch ? metaKeywordsMatch[1] : "NOT FOUND"}`);
    console.log("----------------------");

    if (titleMatch && titleMatch[1].includes("SEO_VERIFIED_TITLE")) {
        console.log("✅ Title is CORRECT!");
    } else {
        console.log("❌ Title mismatch!");
    }

    if (metaDescMatch && metaDescMatch[1].includes("SEO_VERIFIED_DESC")) {
        console.log("✅ Description is CORRECT!");
    } else {
        console.log("❌ Description mismatch!");
    }

    // Still check DOM
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(pdpUrl);
    
    const brandText = await page.innerText("body");
    const hasBrand = brandText.includes("BRAND_VERIFIED");
    console.log(`✅ DOM contains Brand: ${hasBrand}`);

    await browser.close();

  } catch (err) {
    console.error(`\n💥 FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();
